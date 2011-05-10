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
/*global getPublicKey, doEncrypt*/

// Register Namespace
if (typeof(Asymcrypt) === "undefined") {
	var Asymcrypt = {};
} else {
	alert("Somebody captured the Namespace Asymcrypt!!!");
}

Asymcrypt.initiator = {};
Asymcrypt.setInitiator = function (publicKey) {
	var ini = {}, to, i, niceFingerprint, pKey = new getPublicKey(publicKey);

	ini.keyId = pKey.keyid;
	ini.key = pKey.pkey.replace(/\n/g, '');

	ini.fp = pKey.fp;
	ini.fingerprint = ini.fp.toUpperCase();
	to = ini.fingerprint.length;
	niceFingerprint = "";
	for (i = 0; i < to; i++) {
		niceFingerprint += ini.fingerprint[i];
		if ((i + 1) % 4 === 0 && (i + 1) !== to) {
			niceFingerprint += ' ';
		}
	}
	ini.fingerprint = niceFingerprint;

	if (pKey.type === "RSA") {
		ini.encryption = 0;
	} else if (pKey.type === "ELGAMAL") {
		ini.encryption = 1;
	}
	ini.user = pKey.user;
	ini.name = $('<div/>').text(pKey.user.replace(/ <.*>/g, '')).html();
	ini.mail = pKey.user.replace(/^[^<]*</, '').replace(/>/, "");
	Asymcrypt.initiator = ini;
};

Asymcrypt.encrypt = function (plain) {
	return doEncrypt(Asymcrypt.initiator.keyId, Asymcrypt.initiator.encryption, Asymcrypt.initiator.key, plain);
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
