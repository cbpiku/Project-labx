ace_ver = v1.3.3
jq_ver = 1.8.1
jq_xmlrpc_ver = 0.4.3
vuejs_ver = 2.5.16
vuejs_res_ver =1.5.0
require_ver = 2.3.5
offline_ver = 0.7.19
font_awesome_ver = 4.7.0

all: download

download:
	mkdir -p js/lib
	mkdir -p offline
	mkdir -p fonts
	git clone --depth=1 --branch $(ace_ver) https://github.com/ajaxorg/ace-builds.git
	wget -P js/lib https://ajax.googleapis.com/ajax/libs/jquery/$(jq_ver)/jquery.min.js
	wget -P js/lib https://cdnjs.cloudflare.com/ajax/libs/jquery-xmlrpc/$(jq_xmlrpc_ver)/jquery.xmlrpc.js
	wget -P js/lib https://cdnjs.cloudflare.com/ajax/libs/vue/$(vuejs_ver)/vue.js
	wget -P js/lib https://cdnjs.cloudflare.com/ajax/libs/vue-resource/$(vuejs_res_ver)/vue-resource.js
	wget -P js/lib https://cdnjs.cloudflare.com/ajax/libs/require.js/$(require_ver)/require.js
	wget -P offline https://cdnjs.cloudflare.com/ajax/libs/offline-js/$(offline_ver)/offline.min.js
	wget -P offline https://cdnjs.cloudflare.com/ajax/libs/offline-js/$(offline_ver)/themes/offline-theme-slide.css
	wget -P offline https://cdnjs.cloudflare.com/ajax/libs/offline-js/$(offline_ver)/themes/offline-language-english.css
	wget -c -P css https://maxcdn.bootstrapcdn.com/font-awesome/$(font_awesome_ver)/css/font-awesome.min.css
	wget -P fonts https://cdnjs.cloudflare.com/ajax/libs/font-awesome/$(font_awesome_ver)/fonts/fontawesome-webfont.eot
	wget -P fonts https://cdnjs.cloudflare.com/ajax/libs/font-awesome/$(font_awesome_ver)/fonts/fontawesome-webfont.svg
	wget -P fonts https://cdnjs.cloudflare.com/ajax/libs/font-awesome/$(font_awesome_ver)/fonts/fontawesome-webfont.ttf
	wget -P fonts https://cdnjs.cloudflare.com/ajax/libs/font-awesome/$(font_awesome_ver)/fonts/fontawesome-webfont.woff
	wget -P fonts https://cdnjs.cloudflare.com/ajax/libs/font-awesome/$(font_awesome_ver)/fonts/fontawesome-webfont.woff2
	cp labx.html index.html

clean:
	rm -rf js/lib
	rm -rf offline
	rm -rf ace-builds
	rm -f css/font-awesome.min.css
	rm -rf fonts
	rm -f index.html
