Frontend.session = {
	'user': null,
	'init': function(data, callback){
		$('.logged-in, .logged-out').hide();

		if ( !data ){
			var sid = getCookie('sid');
			if ( !sid ){
				$('.logged-out').show();

				if ( callback )
					callback(false);
				return;
			}

			Frontend.session.init({
				'sid': sid
			}, callback);
			return;
		}

		function onSession(){
			Frontend.session.user = data;
			setCookie('sid', data.sid);

			if ( data.id ){
				$('.session-username').text(data.username);
				$('.logged-in').show();
				if ( callback )
					callback(true);
			}
			else{
				$.getJSON('api.php', {
					'action': 'getSessionData',
					'sid': data.sid
				}, function(retu){
					if ( !retu || retu.error )
						onNoSession();
					else if ( retu.id )
						Frontend.session.init(retu, callback);
				});
			}
		}

		function onNoSession(){
			$('.logged-out').show();

			if ( callback )
				callback(false);
		}

		if ( data && data.sid )
			onSession();
		else
			onNoSession();
	},
	'destroy': function(){
		$('.logged-in').hide();

		if ( Frontend.session.user && Frontend.session.user.sid ){
			$.getJSON('api.php', {
				'action': 'logout',
				'sid': Frontend.session.user.sid
			}, function(){
				$('.logged-out').show();
			});
		}

		Frontend.session.user = null;
		setCookie('sid', '');
	},
	'login': function(username, password){
		$.getJSON('api.php', {
			'action': 'login',
			'username': username,
			'password': SHA1(password)
		}, function(data){
			if ( !data || data.error )
				Frontend.toast.show.error(data.error);
			else{
				Frontend.dialogs.closeAll();
				Frontend.session.init(data);
			}
		});
	},
	'register': function(username, password){
		$.getJSON('api.php', {
			'action': 'register',
			'username': username,
			'password': SHA1(password),
			'captcha_challenge': Frontend.captcha.getChallenge(),
			'captcha_response': Frontend.captcha.getResponse()
		}, function(data){
			if ( !data || data.error ){
				Frontend.toast.show.error(data.error);
				Frontend.captcha.reload();
			}
			else{
				Frontend.toast.show.success('User account created!');
				Frontend.session.init(data);
			}
		});
	}
};
