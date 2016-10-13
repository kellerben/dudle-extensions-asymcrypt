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

/**
* init poll for asymcrypt
*/
Asymcrypt.saveInitiator = function (publicKey) {
	Asymcrypt.setInitiator(publicKey);

	Poll.store("Asymcrypt", "initiator", JSON.stringify(publicKey), {
		// FIXME: store password with PBKDF2/bcrypt 
		write_passwd_new: $("#password0").val(),
		success: function () {
			$('#ac_admin').unbind().submit();
		}
	});
};


// FIXME: Bugfix for openpgp.js
// see: https://github.com/openpgpjs/openpgpjs/issues/477
/**
 * Search for a public key on the key server either by key ID or part of the user ID.
 * @param  {String}   options.query   This can be any part of the key user ID such as name
 *   or email address.
 * @return {Array} An array of key IDs, fingerprints, usernames, mail addresses and key IDs
 */
openpgp.HKP.prototype.search = function (options) {
  var uri = this._baseUrl + '/pks/lookup?op=index&options=mr&search=',
      fetch = this._fetch;

  if (options.query) {
    uri += encodeURIComponent(options.query);
  } else {
    throw new Error('You must provide a query parameter!');
  }

  return fetch(uri).then(function (response) {
    var result;
    if (response.status === 404) {
      return "";
    } else if (response.status === 200) {
      result = response.text();
      return result;
    }
  }).then(function(uids){
    var result, uidary, values;
    uidary = uids.match(/pub:(.|\nuid)*/gm);
    result = {};
    for (var i in uidary) {
      var keyID;
      values = uidary[i].match(/pub:.*/)[0].split(":");
      keyID = values[1].substr(24,16);
      result[keyID] = {};
      result[keyID].fingerprint = values[1];
      result[keyID].algo = values[2];
      result[keyID].keylength = values[3];
      result[keyID].created = new Date(parseInt(values[4])*1000);
      result[keyID].valid = new Date(parseInt(values[5])*1000);

      result[keyID].uids = [];
      values = uidary[i].match(/uid:.*/g);
      for (var n in values) {
        result[keyID].uids.push(values[n].split(":")[1]);
      }
    };
    return result;
  });
};
// End of Bugfix



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
							var hkp = new openpgp.HKP('https://pgp.mit.edu');
							hkp.search({query: $('#asymID').val()}).then(function (people) {
								var select, index, tr;
								if (Object.keys(people).length > 0) {
									select = $("<select />",{
										name: "publicKey",
										id: "publicKey",
										size:"1",
										style:"width:300px"
									});
									for (index in people) {
										if (people[index] !== null) {
											select.append($("<option />",{text : index + " " + people[index].uids[0]}));
										}
									}

									if ($('#publicKey').length === 0) {
										tr = $('<tr />').append($('<td/>')).append(select);
										$(tr).insertBefore($('#ac_admin tr:last'));
										$('#ac_admin :submit').val(_("Save"));
										$('#error').remove();
									} else {
										$('#publicKey').replaceWith(select);
									}
								} else {
									var error = _("The name could not be found or the request was to inexplicit.");
									$('<p id="error" class="shorttextcolumn"><span class="error">' + error + '</span></p>').insertBefore('#ac_admin :submit');
								}
							});
							return false;
						} else {
							var keyID = $('#publicKey').val().split(" ")[0];
							var hkp = new openpgp.HKP('https://pgp.mit.edu');
							hkp.lookup({keyId: keyID}).then(function (pubKey) {
								if (pubKey) {
									Asymcrypt.saveInitiator(pubKey);
								} else {
									alert("No key for 0x"+keyID+"found!");
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
