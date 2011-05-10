/****************************************************************************
 * Copyright 2011 Benjamin Kellermann, Martin Sachse, Oliver Hoehne,        *
 * Robert Bachran                                                           *
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
 ****************************************************************************/

"use strict";
/*global s2r, randomString, doEncrypt*/


/**
* saves the encrypted data to the asymcrypt_data.yaml
*/
Asymcrypt.savePollData = function (encryption, keyId, publicKey) {
	var enc_user_input, user_input = Poll.getParticipantInput();

	if (user_input.name.length !== 0) {
		if (user_input.name.match(/"/) || user_input.name.match(/'/)) {
			Poll.error(_("The username must not contain the characters ' and \"!"));
			return false;
		}
		user_input.name = escapeHtml(user_input.name);
		delete(user_input.oldname);
		
		user_input.write_passwd = s2r(randomString(9));
		enc_user_input = doEncrypt(keyId, encryption, publicKey, JSON.stringify(user_input));
		Poll.store("Asymcrypt", "vote_" + Asymcrypt.castedVotes, JSON.stringify(enc_user_input), {
			success: function () {
				Asymcrypt.castedVotes++;
				Asymcrypt.encryptedRows.push(enc_user_input);
			},
			write_passwd_new: user_input.write_passwd
		});
	}
};


/**
* formats the fingerprint
*/
Asymcrypt.toFingerprint = function (fingerprint) {
	fingerprint = fingerprint.toUpperCase();
	var to = fingerprint.length,
		niceFingerprint = "", i;
	for (i = 0; i < to; i++) {
		niceFingerprint += fingerprint[i];
		if ((i + 1) % 4 === 0 && (i + 1) !== to) {
			niceFingerprint += ' ';
		}
	}
	return niceFingerprint;
};

Asymcrypt.encryptedRows = [];
Asymcrypt.castedVotes = 0;
Asymcrypt.loadVotes = function () {
	Poll.load("Asymcrypt", "vote_" + Asymcrypt.castedVotes, {
		error: {}, // finished now
		success: function (vote) {
			if (Asymcrypt.castedVotes === 0) {
				Poll.addParticipantTR('encryptedData', printf(_('There are encrypted votes. Klick here if you are %1.'), [Asymcrypt.keyOwnerName]));
				$('#encryptedData').click(function () {
					$('#encryptedData').remove();
					for (var i = 0; i < Asymcrypt.encryptedRows.length; i++) {
						Poll.addParticipantTR('encRow' + i, '<textarea rows="1" cols="1" style="width: 95%; margin-top:5px">' + Asymcrypt.encryptedRows[i] + '</textarea>');
					}
				});
			}
			Asymcrypt.encryptedRows.push(JSON.parse(vote));
			Asymcrypt.castedVotes += 1;
			Asymcrypt.loadVotes();
		}
	});
};

$(document).ready(function () {
	Poll.load("Asymcrypt", "initiator", {
		error: {}, // poll is not configured for Asymcrypt
		success: function (initiator) {
			var db = JSON.parse(initiator),
				hint;
			Asymcrypt.keyOwnerName = $('<div/>').text(db.keyOwner.replace(/ <.*>/g, '')).html();
			hint = '<div class="shorttextcolumn"';
			// FIXME: check fingerprint
			hint += 'title="' + printf(_("e-mail: %1, fingerprint: %2"), [db.keyOwner.replace(/^[^<]*</, '').replace(/>/, ""), Asymcrypt.toFingerprint(db.fingerprint)]);
			hint += '"><span class="hint">';
			hint += printf(_('Your vote will be encrypted to %1.'), [Asymcrypt.keyOwnerName]);
			hint += '</span></div>';
			$(hint).insertBefore('#savebutton');

			Asymcrypt.loadVotes();

			//catch the submit event
			$('#polltable form').submit(function (e) {
				e.preventDefault();

				Asymcrypt.savePollData(db.encryption, db.keyId, db.key);

				//shows the vote encrypted message
				Poll.hint(_('Thank you for your vote.'));
				Poll.resetForm();
			});

			$('tr[id^="encRow"] textarea').live('focusin', function () {
				Asymcrypt.inputContent = $(this).val();
				$(this).select();
			}).live('focusout', function () {
				if ($(this).val() !== Asymcrypt.inputContent) {  
					$(this).parent().parent().remove();
					var decodedText = JSON.parse($(this).val());
					Poll.parseNaddRow(decodedText.name, decodedText);
				}
			});
		}
	});
});
