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
/*global getPublicKey */

/**
* init poll for asymcrypt
*/
Asymcrypt.saveData = function (publicKey, keyOwner) {
	var pKey = new getPublicKey(publicKey), initiator = {};
	initiator.keyId = pKey.keyid;
	initiator.key = pKey.pkey.replace(/\n/g, '');
	initiator.fingerprint = pKey.fp;
	initiator.keyOwner = keyOwner;

	if (pKey.type === "RSA") {
		initiator.encryption = 0;
	} else if (pKey.type === "ELGAMAL") {
		initiator.encryption = 1;
	}
	
	Poll.store("Asymcrypt", "initiator", JSON.stringify(initiator), {
		success: function () {
			Poll.store("Asymcrypt", "castedVotes", "0", {
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
	}
	
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
					success: function (r) {
						Asymcrypt.saveData(r, person.join(" "));
					},
					error: function (e) {
						alert(e.responseText);
					}
				});
			}
			return false;
		}
	});
});
