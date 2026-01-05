// 服务器房间管理
//@ts-nocheck

(function () {
	var fs = require("fs");
	var path = require("path");
	var crypto = require("crypto");
	var WebSocketServer = require("ws").Server;
	var wss = new WebSocketServer({ port: 8080 });
	var bannedKeys = [];
	var bannedIps = [];

	var rooms = [];
	var events = [];
	var clients = {};
	var bannedKeyWords = [];
	var accountsPath = path.join(__dirname, "accounts.json");
	var accounts = { users: {} };

	var loadAccounts = function () {
		try {
			if (fs.existsSync(accountsPath)) {
				var raw = fs.readFileSync(accountsPath, "utf-8");
				var parsed = JSON.parse(raw);
				if (parsed && typeof parsed == "object" && parsed.users && typeof parsed.users == "object") {
					accounts = parsed;
				}
			}
		} catch (e) {
			console.log("accounts load failed:", e);
		}
	};

	var saveAccounts = function () {
		try {
			fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
		} catch (e) {
			console.log("accounts save failed:", e);
		}
	};

	var normalizeUsername = function (name) {
		return String(name || "").trim();
	};

	var normalizeAvatar = function (avatar) {
		if (typeof avatar != "string") {return "";}
		var trimmed = avatar.trim();
		if (!trimmed) {return "";}
		if (trimmed.length > 2048) {return "";}
		return trimmed;
	};

	var isValidUsername = function (name) {
		return /^[a-zA-Z0-9_]{3,16}$/.test(name);
	};

	var isValidPassword = function (password) {
		return typeof password == "string" && password.length >= 6 && password.length <= 64;
	};

	var hashPassword = function (password, salt) {
		return crypto.scryptSync(password, salt, 64).toString("hex");
	};

	var getGuestName = function () {
		var num = Math.floor(Math.random() * 1000000)
			.toString()
			.padStart(6, "0");
		return "游客" + num;
	};

	var requireAuth = function (ws) {
		if (ws.authed) {return true;}
		ws.sendl("authrequired");
		return false;
	};

	loadAccounts();
	var messages = {
		register: function (username, password, nickname, avatar) {
			username = normalizeUsername(username);
			avatar = normalizeAvatar(avatar);
			if (!isValidUsername(username) || !isValidPassword(password)) {
				this.sendl("auth", { ok: false, reason: "invalid" });
				return;
			}
			var key = username.toLowerCase();
			if (accounts.users[key]) {
				this.sendl("auth", { ok: false, reason: "exists" });
				return;
			}
			var salt = crypto.randomBytes(16).toString("hex");
			var hash = hashPassword(password, salt);
			accounts.users[key] = {
				username: username,
				salt: salt,
				hash: hash,
				avatar: avatar || "",
				createdAt: Date.now(),
			};
			saveAccounts();
			this.authed = true;
			this.account = { username: username, guest: false };
			this.nickname = util.getNickname(username);
			this.avatar = avatar || "caocao";
			util.updateclients();
			this.sendl("auth", {
				ok: true,
				username: username,
				guest: false,
				nickname: this.nickname,
				avatar: this.avatar,
			});
		},
		login: function (username, password, nickname, avatar) {
			username = normalizeUsername(username);
			avatar = normalizeAvatar(avatar);
			if (!isValidUsername(username) || !isValidPassword(password)) {
				this.sendl("auth", { ok: false, reason: "invalid" });
				return;
			}
			var key = username.toLowerCase();
			var account = accounts.users[key];
			if (!account) {
				this.sendl("auth", { ok: false, reason: "notfound" });
				return;
			}
			var hash = hashPassword(password, account.salt);
			if (hash !== account.hash) {
				this.sendl("auth", { ok: false, reason: "password" });
				return;
			}
			if (avatar) {
				account.avatar = avatar;
				saveAccounts();
			}
			this.authed = true;
			this.account = { username: account.username, guest: false };
			this.nickname = util.getNickname(account.username);
			this.avatar = account.avatar || avatar || "caocao";
			util.updateclients();
			this.sendl("auth", {
				ok: true,
				username: account.username,
				guest: false,
				nickname: this.nickname,
				avatar: this.avatar,
			});
		},
		guest: function (nickname, avatar) {
			var guestName = getGuestName();
			avatar = normalizeAvatar(avatar);
			this.authed = true;
			this.account = { username: "guest_" + util.getid(), guest: true };
			this.nickname = util.getNickname(guestName);
			this.avatar = avatar || "caocao";
			util.updateclients();
			this.sendl("auth", {
				ok: true,
				username: this.account.username,
				guest: true,
				nickname: this.nickname,
				avatar: this.avatar,
			});
		},
		create: function (key, nickname, avatar, config, mode) {
			if (!requireAuth(this)) {return;}
			if (this.onlineKey != key) {return;}
			this.nickname = util.getNickname(nickname);
			this.avatar = avatar;
			var room = {};
			rooms.push(room);
			this.room = room;
			delete this.status;
			room.owner = this;
			room.key = key;
			this.sendl("createroom", key);
		},
		enter: function (key, nickname, avatar) {
			if (!requireAuth(this)) {return;}
			this.nickname = util.getNickname(nickname);
			this.avatar = avatar;
			var room = false;
			for (var i of rooms) {
				if (i.key == key) {
					room = i;
					break;
				}
			}
			if (!room) {
				this.sendl("enterroomfailed");
				return;
			}
			this.room = room;
			delete this.status;
			if (room.owner) {
				if (
					room.servermode &&
					!room.owner._onconfig &&
					config &&
					mode
				) {
					room.owner.sendl("createroom", index, config, mode);
					room.owner._onconfig = this;
					room.owner.nickname = util.getNickname(nickname);
					room.owner.avatar = avatar;
				} else if (
					!room.config ||
					(room.config.gameStarted &&
						(!room.config.observe || !room.config.observeReady))
				) {
					this.sendl("enterroomfailed");
				} else {
					this.owner = room.owner;
					this.owner.sendl("onconnection", this.wsid);
				}
				util.updaterooms();
			}
		},
		changeAvatar: function (nickname, avatar) {
			if (!requireAuth(this)) {return;}
			this.nickname = util.getNickname(nickname);
			this.avatar = normalizeAvatar(avatar) || this.avatar;
			if (this.account && !this.account.guest && this.avatar) {
				var key = this.account.username.toLowerCase();
				if (accounts.users[key]) {
					accounts.users[key].avatar = this.avatar;
					saveAccounts();
				}
			}
			util.updateclients();
		},
		server: function (cfg) {
			if (!requireAuth(this)) {return;}
			if (cfg) {
				this.servermode = true;
				var room = rooms[cfg[0]];
				if (!room || room.owner) {
					this.sendl("reloadroom", true);
				} else {
					room.owner = this;
					this.room = room;
					this.nickname = util.getNickname(cfg[1]);
					this.avatar = cfg[2];
					this.sendl("createroom", cfg[0], {}, "auto");
				}
			} else {
				for (var i = 0; i < rooms.length; i++) {
					if (!rooms[i].owner) {
						rooms[i].owner = this;
						rooms[i].servermode = true;
						this.room = rooms[i];
						this.servermode = true;
						break;
					}
				}
				util.updaterooms();
			}
		},
		key: function (id) {
			if (!id || typeof id != "object") {
				this.sendl("denied", "key");
				this.close();
				clearTimeout(this.keyCheck);
				delete this.keyCheck;
				return;
			} else if (bannedKeys.indexOf(id[0]) != -1) {
				bannedIps.push(this._socket.remoteAddress);
				this.close();
			}
			this.onlineKey = id[0];
			clearTimeout(this.keyCheck);
			delete this.keyCheck;
		},
		events: function (cfg, id, type) {
			if (!requireAuth(this)) {return;}
			if (
				bannedKeys.indexOf(id) != -1 ||
				typeof id != "string" ||
				this.onlineKey != id
			) {
				bannedIps.push(this._socket.remoteAddress);
				console.log(id, this._socket.remoteAddress);
				this.close();
				return;
			}
			var changed = false;
			var time = new Date().getTime();
			if (cfg && id) {
				if (typeof cfg == "string") {
					for (var i = 0; i < events.length; i++) {
						if (events[i].id == cfg) {
							if (type == "join") {
								if (events[i].members.indexOf(id) == -1) {
									events[i].members.push(id);
								}
								changed = true;
							} else if (type == "leave") {
								var index = events[i].members.indexOf(id);
								if (index != -1) {
									events[i].members.splice(index, 1);
									if (events[i].members.length == 0) {
										events.splice(i--, 1);
									}
								}
								changed = true;
							}
						}
					}
				} else if (
					Object.hasOwn(cfg, "utc") &&
					Object.hasOwn(cfg, "day") &&
					Object.hasOwn(cfg, "hour") &&
					Object.hasOwn(cfg, "content")
				) {
					if (events.length >= 20) {
						this.sendl("eventsdenied", "total");
					} else if (cfg.utc <= time) {
						this.sendl("eventsdenied", "time");
					} else if (util.isBanned(cfg.content)) {
						this.sendl("eventsdenied", "ban");
					} else {
						cfg.nickname = util.getNickname(cfg.nickname);
						cfg.avatar = cfg.nickname || "caocao";
						cfg.creator = id;
						cfg.id = util.getid();
						cfg.members = [id];
						events.unshift(cfg);
						changed = true;
					}
				}
			}
			if (changed) {
				util.updateevents();
			}
		},
		config: function (config) {
			if (!requireAuth(this)) {return;}
			var room = this.room;
			if (room && room.owner == this) {
				if (room.servermode) {
					room.servermode = false;
					if (this._onconfig) {
						if (clients[this._onconfig.wsid]) {
							this._onconfig.owner = this;
							this.sendl("onconnection", this._onconfig.wsid);
						}
						delete this._onconfig;
					}
				}
				room.config = config;
			}
			util.updaterooms();
		},
		status: function (str) {
			if (!requireAuth(this)) {return;}
			if (typeof str == "string") {
				this.status = str;
			} else {
				delete this.status;
			}
			util.updateclients();
		},
		send: function (id, message) {
			if (!requireAuth(this)) {return;}
			if (clients[id] && clients[id].owner == this) {
				try {
					clients[id].send(message);
				} catch (e) {
					clients[id].close();
				}
			}
		},
		close: function (id) {
			if (!requireAuth(this)) {return;}
			if (clients[id] && clients[id].owner == this) {
				clients[id].close();
			}
		},
	};
	var util = {
		getNickname: function (str) {
			return typeof str == "string" ? str.slice(0, 12) : "无名玩家";
		},
		isBanned: function (str) {
			for (var i of bannedKeyWords) {
				if (str.indexOf(i) != -1) {return true;}
			}
			return false;
		},
		sendl: function () {
			var args = [];
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			try {
				this.send(JSON.stringify(args));
			} catch (e) {
				this.close();
			}
		},
		getid: function () {
			return Math.floor(
				1000000000 + 9000000000 * Math.random()
			).toString();
		},
		getroomlist: function () {
			var roomlist = [];
			for (var i = 0; i < rooms.length; i++) {
				rooms[i]._num = 0;
			}
			for (var i in clients) {
				if (clients[i].room && !clients[i].servermode) {
					clients[i].room._num++;
				}
			}
			for (var i = 0; i < rooms.length; i++) {
				if (rooms[i].servermode) {
					roomlist[i] = "server";
				} else if (rooms[i].owner && rooms[i].config) {
					if (rooms[i]._num == 0) {
						rooms[i].owner.sendl("reloadroom");
					}
					roomlist.push([
						rooms[i].owner.nickname,
						rooms[i].owner.avatar,
						rooms[i].config,
						rooms[i]._num,
						rooms[i].key,
					]);
				}
				delete rooms[i]._num;
			}
			return roomlist;
		},
		getclientlist: function () {
			var clientlist = [];
			for (var i in clients) {
				clientlist.push([
					clients[i].nickname,
					clients[i].avatar,
					!clients[i].room,
					clients[i].status,
					clients[i].wsid,
					clients[i].onlineKey,
				]);
			}
			return clientlist;
		},
		updaterooms: function () {
			var roomlist = util.getroomlist();
			var clientlist = util.getclientlist();
			for (var i in clients) {
				if (!clients[i].room) {
					clients[i].sendl("updaterooms", roomlist, clientlist);
				}
			}
		},
		updateclients: function () {
			var clientlist = util.getclientlist();
			for (var i in clients) {
				if (!clients[i].room) {
					clients[i].sendl("updateclients", clientlist);
				}
			}
		},
		checkevents: function () {
			if (events.length) {
				var time = new Date().getTime();
				for (var i = 0; i < events.length; i++) {
					if (events[i].utc <= time) {
						events.splice(i--, 1);
					}
				}
			}
			return events;
		},
		updateevents: function () {
			util.checkevents();
			for (var i in clients) {
				if (!clients[i].room) {
					clients[i].sendl("updateevents", events);
				}
			}
		},
	};
	wss.on("connection", function (ws) {
		ws.sendl = util.sendl;
		if (bannedIps.indexOf(ws._socket.remoteAddress) != -1) {
			ws.sendl("denied", "banned");
			setTimeout(function () {
				ws.close();
			}, 500);
			return;
		}
		ws.keyCheck = setTimeout(function () {
			ws.sendl("denied", "key");
			setTimeout(function () {
				ws.close();
			}, 500);
		}, 2000);
		ws.wsid = util.getid();
		clients[ws.wsid] = ws;
		ws.sendl(
			"roomlist",
			util.getroomlist(),
			util.checkevents(),
			util.getclientlist(ws),
			ws.wsid
		);
		ws.heartbeat = setInterval(function () {
			if (ws.beat) {
				ws.close();
				clearInterval(ws.heartbeat);
			} else {
				ws.beat = true;
				try {
					ws.send("heartbeat");
				} catch (e) {
					ws.close();
				}
			}
		}, 60000);
		ws.on("message", function (message) {
			if (!clients[this.wsid]) {return;}
			if (message == "heartbeat") {
				this.beat = false;
			} else if (this.owner) {
				this.owner.sendl("onmessage", this.wsid, message);
			} else {
				var arr;
				try {
					arr = JSON.parse(message);
					if (!Array.isArray(arr)) {
						throw "err";
					}
				} catch (e) {
					this.sendl("denied", "banned");
					return;
				}
				if (arr.shift() == "server") {
					var type = arr.shift();
					if (messages[type]) {
						messages[type].apply(this, arr);
					}
				}
			}
		});
		ws.on("close", function () {
			for (var i = 0; i < rooms.length; i++) {
				if (rooms[i].owner == this) {
					for (var j in clients) {
						if (clients[j].room == rooms[i] && clients[j] != this) {
							clients[j].sendl("selfclose");
							// clients[j].close();
							// delete clients[j];
						}
					}
					rooms.splice(i--, 1);
				}
			}
			if (clients[this.wsid]) {
				if (this.owner) {
					this.owner.sendl("onclose", this.wsid);
				}
				delete clients[this.wsid];
			}
			if (this.room) {util.updaterooms();}
			else {util.updateclients();}
		});
	});
})();
