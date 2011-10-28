Frontend.Dialog = function(title, content, options){
	var self = this;
	
	self.dom = null;
	
	self.title = (title && title.length>0) ? title : null;
	self.content = [];
	self.options = options || {};
	
	// Normalize content
	var normalizeContent = function(data){
		if ( typeof(data) == 'string' || Array.isArray(data) )
			data = {'content': data};
		
		if ( !data.title || data.title.length == 0 )
			data.title = undefined;
		if ( !data.type )
			data.type = 'paragraph';
		if ( !data.parent )
			data.parent = undefined;
		
		if ( Array.isArray(data.content) ){
			data.content = data.content.map(normalizeContent);
			data.content.forEach(function(val){
				val.parent = data;
			});
		}
		
		return data;
	}
	self.content = (Array.isArray(content)?content:[content]).map(normalizeContent);
};

Frontend.Dialog.prototype.createDOM = function(){
	var self = this;
	
	if ( self.dom )
		$(self.dom).remove();
	
	self.dom = $('<div>');
	
	//if ( self.title ){
	//	self.dom.append($('<h2>', {
	//		'html': self.title
	//	}));
	//}
	
	var renderContent = function(data){
		var pieceDOM = null;
		switch ( data.type ){
			case 'paragraph':
			case 'list-element':
				pieceDOM = (data.parent && data.parent.type == 'list') ? $('<li>', data.attributes||undefined) : $('<p>', data.attributes||undefined);
			break;
			case 'div':
			case 'form':
			case 'input':
				pieceDOM = $('<'+data.type+'>', data.attributes||undefined);
			break;
			case 'list':
				pieceDOM = $('<ul>', data.attributes||undefined);
			break;
			case 'raw':
				pieceDOM = $(data.content, data.attributes||undefined);
			break;
		}
		
		if ( data.content && data.type != 'raw' ){
			if ( Array.isArray(data.content) ){
				data.content.forEach(function(subdata){
					pieceDOM.append(renderContent(subdata));
				});
			}
			else if ( typeof(data.content) == 'string' )
				pieceDOM.html(data.content);
			else
				pieceDOM.append(renderContent(data.content));
		}
		
		if ( data.title ){
			return Array.prototype.concat.apply([
				$(data.type=='input' ? '<label>' : '<h3>', {
					'for': data.type=='input' && data.attributes && data.attributes.id || undefined,
					'html': data.title
				})[0]
			], pieceDOM.get());
		}
		
		return pieceDOM[0];
	};
	self.content.forEach(function(data){
		if ( data )
			self.dom.append(renderContent(data));
	})
	
	self.dom.appendTo(document.body);
	
	self.dom.dialog(fillRightToLeft(self.options, {
		'autoOpen': false,
		'title': self.title,
		'show': 'slide',
		'hide': 'slide',
		'resizable': false
	}));
	
	if ( self.options.afterCreateDOM )
		self.options.afterCreateDOM(self.dom);
};

Frontend.Dialog.prototype.open = function(){
	var self = this;
	
	if ( !self.dom )
		self.createDOM();
	
	return self.dom.dialog('open');
};


Frontend.dialogs = {
	/**
	 * @param {String} key A key used to refer to this dialog.
	 * @param {String} title The title of the dialog.
	 * @param {Array} content The content of the dialog. An array containing strings and/or objects of the following form: { 'title':'h3 content', 'type':'paragraph|div|list|form|input|raw', 'attributes':{}, 'content':[more content definitions] }
	 * @param {Object} [options] Options given to the dialog constructor.
	 * @returns {Object} The dialog that was created.
	 */
	'add': function(key, title, content, options){
		return Frontend.dialogs[key] = new Frontend.Dialog(title, content, options);
	},
	
	'closeAll': function(){
		$('.ui-dialog-content:visible').dialog('close');
	},
	
	'confirm': function(title, content, callback, buttons, options){
		if ( !title )
			title = 'Confirmation';
		if ( !buttons )
			buttons = [{'OK':true}, {'Cancel':false}];
		if ( !options )
			options = {};
		if ( !options.buttons )
			options.buttons = [];
		
		buttons.forEach(function(button, i){
			var val = i;
			var text = null;
			
			if ( typeof(button) == 'object' ){
				for ( var key in button ){
					if ( button.hasOwnProperty(key) ){
						val = button[key];
						text = key;
						break;
					}
				}
			}
			else
				text = button;
			
			if ( text ){
				options.buttons.push({
					'text': text || 'OK',
					'click': function(e){
						try{
							if ( callback )
								callback(val);
						}
						finally{
							$(this).dialog('close');
							e.preventDefault();
						}
					}
				});
			}
		});
		
		return (new Frontend.Dialog(title, content, options)).open();
	},
	
	'alert': function(title, content, callback){
		return Frontend.dialogs.confirm(title||'Alert', content, callback, [{'OK':true}]);
	}
};

(function(){
	var d = Frontend.dialogs;
	
	d.add('about', 'About', [
		'Plethora is an isometric game engine written in pure Javascript. It utilizes the new HTML5 &lt;canvas&gt; tag that allows for pixel-perfect (and potentially hardware accelerated) drawing in the browser.',
		'It was written as a proof of concept: With today\'s web browser JavaScript performance it is possible to perform simple dynamics simulation and collision detection.',
		'Latest production version of Plethora can be found at <a href="http://github.com/Jontte/plethora">http://github.com/Jontte/plethora</a>. It is published under the three-clause BSD.'
	]);
	
	d.add('tech', 'Technology', [
		'Plethora utilizes a Bounding Interval Hierarchy for static object collision. An excellent implementation in Javascript can be found here: <a href="http://github.com/imbcmdth/jsBIH">http://github.com/imbcmdth/jsBIH</a>',
		'Real time (WebSockets-powered) multiplayer features are planned.'
	]);
	
	d.add('todo', 'TODO', [
		'Plethora is still far from being a full game. Below is a list of important tasks/objectives:',
		{
			'title': 'Short term',
			'type': 'list',
			'content': [
				'More graphics: Character animation, logo, landscapes, everything. Maybe You can help?',
				'Sound effects and background music?'
			]
		},
		{
			'title': 'Long term',
			'type': 'list',
			'content': [
				'Multiplayer mode',
				'Different game modes'
			]
		}
	]);
	
	d.add('author', 'Author', [
		'Plethora was written by Joonas Haapala. His website is located <a href="http://sipuli.net/joonas/">here</a>. Atte Virtanen gave a hand with the server side code and wrote the user interface outside the canvas.',
		'Joonas is no graphics artist, nor does he find general web design (HTML&amp;CSS) particularly interesting, so if you feel like contributing, please contact him at his email joonas[meow]haapa.la. Wishes, ideas, comments, criticism welcome.'
	]);
	
	d.add('loginregister', 'Login / Register', [
		{
			'type': 'div',
			'attributes': {
				'class': 'left-half'
			},
			'content': {
				'type': 'form',
				'attributes': {
					'submit': function(e){
						try{
							Frontend.session.login($('#login-username').val(), $('#login-password').val());
						}
						finally{
							e.preventDefault();
						}
					}
				},
				'title': 'Login',
				'content': [
					{
						'type': 'input',
						'title': 'Username',
						'attributes': {
							'id': 'login-username',
							'type': 'text'
						}
					},
					{
						'type': 'input',
						'title': 'Password',
						'attributes': {
							'id': 'login-password',
							'type': 'password'
						}
					},
					{
						'type': 'input',
						'attributes': {
							'type': 'submit',
							'value': 'Login'
						}
					}
				]
			}
		},
		{
			'type': 'div',
			'attributes': {
				'class': 'right-half'
			},
			'title': 'Register',
			'content': {
				'type': 'form',
				'attributes': {
					'submit': function(e){
						try{
							if ( $('#register-password').val() != $('#register-password-again').val() )
								Frontend.toast.show.error('Passwords don\'t match!');
							else if ( $('#register-username').val().length < 1 )
								Frontend.toast.show.error('Username has to be at least 1 character long!');
							else if ( $('#register-password').val().length < 3 )
								Frontend.toast.show.error('Password has to be at least 3 characters long!');
							else
								Frontend.session.register($('#register-username').val(), $('#register-password').val());
						}
						finally{
							e.preventDefault();
						}
					}
				},
				'content': [
					{
						'type': 'input',
						'title': 'Username',
						'attributes': {
							'id': 'register-username',
							'type': 'text'
						}
					},
					{
						'type': 'input',
						'title': 'Password',
						'attributes': {
							'id': 'register-password',
							'type': 'password'
						}
					},
					,
					{
						'type': 'input',
						'title': 'Password (again)',
						'attributes': {
							'id': 'register-password-again',
							'type': 'password'
						}
					},
					{
						'type': 'input',
						'attributes': {
							'type': 'submit',
							'value': 'Register'
						}
					}
				]
			}
		},
		{
			'type': 'div',
			'attributes': {
				'id': 'register-captcha'
			}
		}
	], {
		'width': 500,
		'open': function(){
			if ( Frontend.captcha.isCreated )
				Frontend.captcha.reload();
			else
				Frontend.captcha.create($('#register-captcha'));
		}
	});
})();
