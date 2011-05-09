############################################################################
# Copyright 2010,2011 Benjamin Kellermann                                  #
#                                                                          #
# This file is part of dudle.                                              #
#                                                                          #
# Dudle is free software: you can redistribute it and/or modify it under   #
# the terms of the GNU Affero General Public License as published by       #
# the Free Software Foundation, either version 3 of the License, or        #
# (at your option) any later version.                                      #
#                                                                          #
# Dudle is distributed in the hope that it will be useful, but WITHOUT ANY #
# WARRANTY; without even the implied warranty of MERCHANTABILITY or        #
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     #
# License for more details.                                                #
#                                                                          #
# You should have received a copy of the GNU Affero General Public License #
# along with dudle.  If not, see <http://www.gnu.org/licenses/>.           #
############################################################################



extDir = "../extensions/asymcrypt"
if File.exists?("#{extDir}/locale/#{GetText.locale.language}/dudle_asymcrypt.po")
	$d.html.add_html_head("<link rel='gettext' type='application/x-po' href='#{extDir}/locale/#{GetText.locale.language}/dudle_asymcrypt.po' />")
end

$d.html.add_head_script("#{extDir}/lib/aes-enc.js")
$d.html.add_head_script("#{extDir}/lib/base64.js")
$d.html.add_head_script("#{extDir}/lib/mouse.js")
$d.html.add_head_script("#{extDir}/lib/PGencode.js")
$d.html.add_head_script("#{extDir}/lib/PGpubkey.js")
$d.html.add_head_script("#{extDir}/lib/rsa.js")
$d.html.add_head_script("#{extDir}/lib/sha1.js")
$d.html.add_head_script("#{extDir}/common.js")

$d.html.add_script(<<SCRIPT
Asymcrypt.extDir = '#{extDir}';
Asymcrypt.passwordStar = '#{PASSWORDSTAR}';
SCRIPT
)

case $d.tab
when "access_control.cgi"
  $d.html.add_head_script("#{extDir}/access_control.js")
when "." 
  if $d.is_poll?
    $d.html.add_head_script("#{extDir}/participate.js")
  end
end


