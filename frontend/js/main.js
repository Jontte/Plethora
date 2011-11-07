var Frontend = {
	'config': {
		'fps': 30
	},
	'cache': {
		'canvasContext': null,
		'currentLevel': null,
		'levels': {},
		'gameMode': 'play'
	},
	'dom': {
		'core': null,
		'cache': null,

		'sidePanel': null,
		'loggedInUsername': null,

		'levelName': null,
		'levelDesc': null,
		'levelAuthor': null,

		'levelListContainer': null,
		'levelList': null,
		'levelListButton': null,

		'gameArea': null,
		'canvas': null
	},

	'dialogs': null, // dialogs.js
	'session': null, // session.js
	'init': null, // init.js

	'toast': {
		// show(), show.notice(), show.success(), show.warning(), show.error()
		'show': (function(){
			var retu = function(){
				return $().toastmessage.apply(this, Array.prototype.concat.apply(['showToast'], arguments));
			};

			['notice', 'success', 'warning', 'error'].forEach(function(name){
				retu[name] = function(){
					return $().toastmessage.apply(this, Array.prototype.concat.apply(['show'+name.substr(0,1).toUpperCase()+name.substr(1)+'Toast'], arguments));
				};
			});

			return retu;
		})(),
		'hide': function(el, options){
			return $().toastmessage.call(this, 'removeToast', el, options);
		}
	},

	'captcha': {
		'isCreated': false,
		'create': function(el, options){
			if ( !options )
				options = {};
			if ( !options.theme )
				options.theme = 'clean';

			el.empty();
			Recaptcha.create(recaptchaPublicKey, el[0], options);
			Frontend.captcha.isCreated = true;
		},
		'reload': function(){
			if ( Frontend.captcha.isCreated )
				Recaptcha.reload();
		},
		'getChallenge': function(){
			return Frontend.captcha.isCreated ? Recaptcha.get_challenge() : null;
		},
		'getResponse': function(){
			return Frontend.captcha.isCreated ? Recaptcha.get_response() : null;
		}
	},

	'setGameMode': function(mode, force){
		if ( !force && World._editor.unsaved_changes && Frontend.cache.gameMode == 'edit' && mode != 'edit' ){
			Frontend.dialogs.confirm('Unsaved Changes', 'You  have unsaved changes. Are you sure you want to exit edit mode without saving?', function(answer){
				if ( answer ){
					Frontend.saveLevel(function(success){
						if ( success )
							Frontend.setGameMode(mode);
					});
				}
				else
					Frontend.setGameMode(mode, true);
			}, [{'Save changes':true}, {'Exit without saving':false}], {'modal':true});
			return;
		}

		Frontend.cache.gameMode = mode;

		$('.gamemode-only').hide();
		$('.gamemode-'+mode+'-only').show();

		$('#gamemode-tabs > *').removeClass('open');
		$('#gamemode-tab-'+mode).addClass('open');

		switch ( mode ){
			case 'play':
				$('#level-info input').attr('readonly', '').addClass('disabled');
			break;
			case 'edit':
				$('#level-info input').removeAttr('readonly').removeClass('disabled');
			break;
		}

		if ( Frontend.cache.currentLevel )
			Frontend.loadLevel();
	},

	'saveLevel': function(callback){
		if ( !Frontend.session.user ){
			Frontend.toast.show.error('You have to be logged in to save a level!');
			if ( callback )
				callback(false);
			return;
		}

		var levelData = World.saveLevel();
		var levelID = World.getLevelName();

		var overwriting = Frontend.cache.levels[levelID] && Frontend.cache.levels[levelID].user_id == Frontend.session.user.id;

		var level = {
			'id': overwriting ? levelID : (new Date).getTime(),
			'name': $('#level-name').val(),
			'desc': $('#level-desc').val(),
			'updated': null,
			'user_id': Frontend.session.user.id,
			'username': Frontend.session.user.username,
			'data': levelData
		};
		if ( overwriting )
			Frontend.cache.levels[level.id] = level;

		$.postJSON('api.php', {
			'action': 'saveLevel', // sid, [id], name, [desc], data
			'sid': Frontend.session.user.sid,
			'id': overwriting ? level.id : undefined,
			'name': level.name,
			'desc': level.desc || undefined,
			'data': JSON.stringify(level.data)
		}, function(data){
			if ( data.error ){
				Frontend.toast.show.error(data.error);
				if ( callback )
					callback(false);
			}
			else{
				if ( data.id != level.id ){
					var oldID = level.id;
					level.id = data.id;
					Frontend.cache.levels[data.id] = level;
					delete Frontend.cache.levels[oldID];
					Frontend.loadLevel(level.id, function(){
						Frontend.toast.show.success('Level saved!');
						if ( callback )
							callback(true);
					});
				}
				else{
					Frontend.toast.show.success('Level saved!');
					if ( callback )
						callback(true);
				}
			}
		});
	},

	'gameLoop': (function(){
		var intervalID = null;

		var callback = function(){
			Frontend.cache.canvasContext.fillRect(0, 0, Frontend.cache.canvasContext.canvas.width, Frontend.cache.canvasContext.canvas.height); // Clear screen

			World.render();
			World.physicsStep();
			Key.timestep();
		};

		var self = {
			'start': function(){
				self.stop();
				intervalID = setInterval(callback, 1000/Frontend.config.fps);
			},
			'stop': function(){
				if ( intervalID ){
					clearInterval(intervalID);
					intervalID = null;
				}
			}
		};
		return self;
	})(),

	'loadLevel': function(id, callback){
		if ( id == null )
			id = Frontend.cache.currentLevel && Frontend.cache.currentLevel.id || null;

		Frontend.gameLoop.stop();

		var level = Frontend.cache.levels[id];
		if ( !level || !level.data ){
			$.getJSON('api.php', {
				'action': 'getLevel',
				'id': id
			}, function(json){
				json.data = JSON.parse(json.data);
				Frontend.cache.levels[id] = json;
				Frontend.loadLevel(id, callback);
			});
			return;
		}

		World.loadLevel(level.id, level.data, Frontend.cache.gameMode=='edit', function(){
			Frontend.cache.currentLevel = level;

			Frontend.dom.levelName.val(level.name);

			if ( level.desc )
				Frontend.dom.levelDesc.show().val(level.desc);
			else
				Frontend.dom.levelDesc.hide();

			if ( level.author ){
				Frontend.dom.levelAuthor.text(level.author);
				$('.level-author').show();
			}
			else
				$('.level-author').hide();

			Frontend.gameLoop.start();
			if ( callback )
				callback();
		});
	}
};

$(function(){
	Frontend.init($('#wrapper'));
});
