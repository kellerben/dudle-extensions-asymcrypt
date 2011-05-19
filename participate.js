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
/*global s2r, randomString*/



Asymcrypt.encryptedRows = [];
Asymcrypt.castedVotes = 0;
Asymcrypt.loadVotes = function () {
	Poll.load("Asymcrypt", "vote_" + Asymcrypt.castedVotes, {
		error: {}, // finished now
		success: function (vote) {
			if (Asymcrypt.castedVotes === 0) {
				Poll.addParticipantTR('encryptedData', printf(_('There are encrypted votes. Click here if you are %1.'), [Asymcrypt.initiator.name]));
				$('#encryptedData').click(function () {
					$('#encryptedData').remove();
					for (var i = 0; i < Asymcrypt.encryptedRows.length; i++) {
						Poll.addParticipantTR('encRow' + i, '<textarea rows="1" cols="1" style="width: 95%; margin-top:5px">' + Asymcrypt.encryptedRows[i] + '</textarea>');

						$('#encRow' + i + ' textarea').bind({
							focusin: function () {
								Asymcrypt.inputContent = $(this).val();
								$(this).select();
							},
							focusout: function () {
								try {
									var decodedText = JSON.parse($(this).val());
									if (decodedText.name) {
										Poll.parseNaddRow(decodedText.name, decodedText);
										$(this).parent().parent().remove();
									}
								} catch (e) {
									if (e.toString() !== "SyntaxError: Unexpected token ILLEGAL") {
										throw e;
									}
								}
							}
						});
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
	Asymcrypt.init({
		error: {}, // poll is not configured for Asymcrypt
		success: function () {
			var hint = '<div class="shorttextcolumn"';
			hint += 'title="' + printf(_("e-mail: %1, fingerprint: %2"), [Asymcrypt.initiator.mail, Asymcrypt.initiator.fingerprint]);
			hint += '"><span class="hint">';
			hint += printf(_('Your vote will be encrypted to %1.'), [Asymcrypt.initiator.name]);
			hint += '</span></div>';
			$(hint).insertBefore('#savebutton');

			Asymcrypt.loadVotes();

			Poll.submitHook(function (user_input) {
				var enc_user_input;

				if (user_input.name.length !== 0) {
					if (user_input.name.match(/"/) || user_input.name.match(/'/)) {
						Poll.error(_("The username must not contain the characters ' and \"!"));
						return false;
					}
					user_input.name = escapeHtml(user_input.name);
					delete(user_input.oldname);

					user_input.write_passwd = s2r(randomString(9));
					enc_user_input = Asymcrypt.encrypt(JSON.stringify(user_input));
					Poll.store("Asymcrypt", "vote_" + Asymcrypt.castedVotes, JSON.stringify(enc_user_input), {
						success: function () {
							Asymcrypt.castedVotes++;
							Asymcrypt.encryptedRows.push(enc_user_input);
						},
						write_passwd_new: user_input.write_passwd
					});
				}

				//shows the vote encrypted message
				Poll.hint(_('Thank you for your vote.'));
				Poll.resetForm();
			});
		}
	});
});
