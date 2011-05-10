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

/**
* init poll for asymcrypt
*/
Asymcrypt.saveInitiator = function (publicKey) {
	var write_passwd = s2r(randomString(9)),
		write_passwd_enc;
	Asymcrypt.setInitiator(publicKey);

	write_passwd_enc = JSON.stringify(Asymcrypt.encrypt(write_passwd));
	Poll.store("Asymcrypt", "initiator_pw", write_passwd_enc, {
		write_passwd_new: write_passwd,
		success: function () {
			Poll.store("Asymcrypt", "initiator", JSON.stringify(publicKey), {
				write_passwd_new: write_passwd,
				success: function () {
					$('#ac_admin').unbind().submit();
				}
			});
		}
	});
};

$(document).ready(function () {
	/**
	* if access_control.cgi is in the view where the admin password is set, asynchronous encryption will be an option
	*/
	if ($('#ac_admin #password0').length === 1) {
		var keytext = _("Activate asymmetric encryption?");
		$('<tr><td></td><td><input type="checkbox" id="asymcrypt" name="asymcrypt" /><label for="asymcrypt">' + keytext + '</label></td></tr>').insertBefore($('#ac_admin tr:last'));
	
		Asymcrypt.init({
			success: function () { // already initialized
				// TODO: allow change of initiator
				$('#asymcrypt')[0].checked = true;
				$('#asymcrypt')[0].disabled = true;
				var tr = '<tr><td></td>';
				tr += '<td title="' + printf(_("e-mail: %1, fingerprint: %2"), [Asymcrypt.initiator.mail, Asymcrypt.initiator.fingerprint]) + '">';
				tr += printf(_('The votes will be encrypted to %1.'), [Asymcrypt.initiator.name]);
				tr += '</td></tr>'
				$(tr).insertBefore($('#ac_admin tr:last'));
			},
			error: function () { // not initialized
				/**
				* if the checkbox becomes activ, an input for the pgp key will be shown
				*/
				$('#asymcrypt').click(function () {
					if ($('#asymcrypt:checked').length === 1 && $('#asymID').length === 0) {
						$('<tr><td></td><td><label for="asymID">' + _("Whats your PGP name?") + '</label><br/><input id="asymID" name="asymID" /></td></tr>').insertBefore($('#ac_admin tr:last'));
							$('#ac_admin :submit').val(_("Search"));
					} else if ($('#asymcrypt:checked').length === 0 && $('#asymID').length === 1) {
						$('#asymID').parents('tr').remove();
						$('#ac_admin :submit').val(_("Save"));
					}
				});
				
				$('#ac_admin').submit(function () {
					if ($('#ac_admin #password0').length === 1 && $('#asymcrypt:checked').length === 1) {
						if ($('#publicKey').length === 0 || $('#publicKey').val() === "") {
							$.ajax({
								url: Asymcrypt.extDir + '/keyserver.cgi',
								data: {
									service: 'peopleSearch',
									name: $('#asymID').val()
								},
								method: "get",
								timeout: (10 * 1000),
								error: function (r, strError) {
									if ($('#error').length === 0) {
										var error = _("The name could not be found or the request was to inexplicit.");
										$('<p id="error" class="shorttextcolumn"><span class="error">' + error + '</span></p>').insertBefore('#ac_admin :submit');
									}
								},
								success: function (r) {
									var possiblePublicKeys = JSON.parse(r), select, index;
									if (possiblePublicKeys.length > 0) {
										if ($('#publicKey').length === 0) {
											select = '<tr><td></td><td><select name="publicKey" id="publicKey" size="1" style="width:300px">';
											for (index in possiblePublicKeys) {
												if (possiblePublicKeys[index] !== null) {
													select += '<option>' + possiblePublicKeys[index] + '</option>';
												}
											}
											select += '</select></td></tr>';
											$(select).insertBefore($('#ac_admin tr:last'));
											$('#ac_admin :submit').val(_("Save"));
											$('#error').remove();
										} else {
											select = '<select name="publicKey" id="publicKey" size="1" style="width:300px">';
											for (index in possiblePublicKeys) {
												if (possiblePublicKeys[index] !== null) {
													select += '<option>' + possiblePublicKeys[index] + '</option>';
												}
											}
											select += '</select>';
											$('#publicKey').replaceWith(select);
										}
									}
								}
							});
							return false;
						} else {
							var person = $('#publicKey').val().split(" ");
							$.ajax({
								url: Asymcrypt.extDir + '/keyserver.cgi',
								data: {
									service: 'getPublicKey',
									keyid: person.shift()
								},
								method: "get",
								success: function (pubKey) {
									Asymcrypt.saveInitiator(pubKey);
								},
								error: function (e) {
									alert(e.responseText);
								}
							});
						}
						return false;
					}
				});
			 }
		});
	}
});
