/****************************************************************************
 * Copyright 2010,2011 Benjamin Kellermann                                  *
 *                                                                          *
 * This file is part of dudle.                                              *
 *                                                                          *
 * Dudle is free software: you can redistribute it and/or modify it under   *
 * the terms of the GNU Affero General Public License as published by       *
 * the Free Software Foundation, either version 3 of the License, or        *
 * (at your option) any later version.                                      *
 *                                                                          *
 * Dudle is distributed in the hope that it will be useful, but WITHOUT ANY *
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or        *
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     *
 * License for more details.                                                *
 *                                                                          *
 * You should have received a copy of the GNU Affero General Public License *
 * along with dudle.  If not, see <http://www.gnu.org/licenses/>.           *
 ***************************************************************************/

"use strict";

// Register Namespace
if (typeof(Asymcrypt) === "undefined") {
	var Asymcrypt = {};
} else {
	alert("Somebody captured the Namespace Asymcrypt!!!");
}

Asymcrypt.initiator = {};
Asymcrypt.setInitiator = function (publicKey) {
	var ini = {}, to, i, niceFingerprint;

	ini.pubkey = new openpgp.key.readArmored(publicKey);

	ini.fingerprint = ini.pubkey.keys[0].primaryKey.fingerprint.toUpperCase();
	to = ini.fingerprint.length;
	niceFingerprint = "";
	for (i = 0; i < to; i++) {
		niceFingerprint += ini.fingerprint[i];
		if ((i + 1) % 4 === 0 && (i + 1) !== to) {
			niceFingerprint += ' ';
		}
	}
	ini.fingerprint = niceFingerprint;

	ini.user = ini.pubkey.keys[0].users[0].userId.userid;
	ini.name = $('<div/>').text(ini.user.replace(/ <.*>/g, '')).html();
	ini.mail = ini.user.replace(/^[^<]*</, '').replace(/>/, "");
	Asymcrypt.initiator = ini;
};

Asymcrypt.encrypt = function (plain, readyfunc) {
	openpgp.encrypt({
		publicKeys: Asymcrypt.initiator.pubkey.keys,
		data: plain,
		armor: true
	}).then(function(enc){
		readyfunc(enc.data);
	});
};

Asymcrypt.init = function () {
	var successfunc = {}, options = arguments[0] || {};
	if (options.success) {
		successfunc = options.success;
	}
	options.success = function (publicKey) {
		Asymcrypt.setInitiator(JSON.parse(publicKey));
		successfunc();
	};
	Poll.load("Asymcrypt", "initiator", options);
};

Asymcrypt.pwgen = function (num) {
	var i, ret = "", keyspace = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	for (i = 0; i < num; i++) {
		ret += keyspace[openpgp.crypto.random.getSecureRandom(0,keyspace.length-1)];
	}
	return ret;
}
