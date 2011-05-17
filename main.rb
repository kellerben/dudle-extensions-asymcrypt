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


e = Extension.new

e.add_lib("aes-enc")
e.add_lib("base64")
e.add_lib("mouse")
e.add_lib("PGencode")
e.add_lib("PGpubkey")
e.add_lib("rsa")
e.add_lib("sha1")

$d.html.add_script(<<SCRIPT
Asymcrypt.extDir = '#{e.basedir}';
Asymcrypt.passwordStar = '#{PASSWORDSTAR}';
SCRIPT
)

e.load_js

