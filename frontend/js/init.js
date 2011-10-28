Frontend.init = function(dom){
	(Frontend.dom.core = dom).append(
		Frontend.dom.sidePanel =
		$('<div>', {
			'id': 'side-panel'
		}).append(
			$('<h1>', {
				'text': 'Plethora'
			})
		).append(
			$('<div>', {
				'id': 'login-section'
			}).append(
				$('<div>', {
					'class': 'logged-in'
				}).append(
					$('<label>', {
						'for': 'logged-in-username',
						'text': 'Logged in as '
					})
				).append(
					Frontend.dom.loggedInUsername =
					$('<span>', {
						'class': 'session-username',
						'text': '...'
					})
				).append(
					$('<span>', {
						'text': ' '
					})
				).append(
					$('<span>', {
						'class': 'clickable',
						'text': 'Logout'
					}).click(function(){
						Frontend.session.destroy();
					})
				)
			).append(
				$('<div>', {
					'class': 'logged-out'
				}).append(
					$('<span>', {
						'class': 'clickable',
						'text': 'Login / Register'
					}).click(function(){
						Frontend.dialogs.loginregister.open();
					})
				)
			)
		).append(
			Frontend.dom.levelListButton =
			$('<div>', {
				'id': 'level-list-button',
				'html': '<span class="rarr">&rarr;</span><span class="larr">&larr;</span>' +
						'<br />' + 'Levels'.split('').join('<br />') + '<br />' +
						'<span class="rarr">&rarr;</span><span class="larr">&larr;</span>',
				'click': function(){
					if ( Frontend.dom.levelListContainer.is(':visible') ){
						Frontend.dom.levelListContainer.hide('slide');
						$(this).removeClass('list-open');
					}
					else{
						Frontend.dom.levelListContainer.show('slide');
						$(this).addClass('list-open');
					}
				}
			})
		).append(
			$('<div>', {
				'id': 'level-info'
			}).append(
				Frontend.dom.levelName =
				$('<input>', {
					'id': 'level-name',
					'type': 'text',
					'value': 'Loading...'
				})
			).append(
				Frontend.dom.levelDesc =
				$('<input>', {
					'id': 'level-desc',
					'type': 'text',
					'value': ''
				}).hide()
			).append(
				$('<label>', {
					'class': 'level-author',
					'for': 'level-author',
					'text': 'by '
				}).hide()
			).append(
				Frontend.dom.levelAuthor =
				$('<span>', {
					'id': 'level-author',
					'class': 'level-author',
					'text': ''
				}).hide()
			)
		).append(
			$('<div>', {
				'id': 'gamemode-tabs'
			}).append(
				$('<span>', {
					'id': 'gamemode-tab-play',
					'text': 'Play',
					'click': function(){
						Frontend.setGameMode('play');
						return false;
					}
				})
			).append(
				$('<span>', {
					'id': 'gamemode-tab-edit',
					'text': 'Edit',
					'click': function(){
						Frontend.setGameMode('edit');
						return false;
					}
				})
			)
		).append(
			$('<div>', {
				'id': 'level-controls'
			}).append(
				$('<div>', {
					'class': 'gamemode-only gamemode-play-only'
				}).append(
					$('<span>', {
						'class': 'button',
						'text': 'Restart',
						'click': function(){
							Frontend.loadLevel();
							return false;
						}
					})
				)
			).append(
				$('<div>', {
					'class': 'gamemode-only gamemode-edit-only'
				}).append(
					$('<span>', {
						'class': 'button',
						'text': 'Reset',
						'click': function(){
							Frontend.loadLevel();
							return false;
						}
					})
				).append(
					$('<span>', {
						'class': 'button',
						'text': 'Save',
						'click': function(){
							if ( !Frontend.session.user ){
								Frontend.toast.show.error('You have to be logged in to save a level!');
								return false;
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
								if ( data.error )
									Frontend.toast.show.error(data.error);
								else{
									if ( data.id != level.id ){
										var oldID = level.id;
										level.id = data.id;
										Frontend.cache.levels[data.id] = level;
										delete Frontend.cache.levels[oldID];
										Frontend.loadLevel(level.id, function(){
											Frontend.toast.show.success('Level saved!');
										});
									}
									else
										Frontend.toast.show.success('Level saved!');
								}
							});
							
							return false;
						}
					})
				)
			)
		)
	).append(
		Frontend.dom.gameArea =
		$('<div>', {
			'id': 'game-area'
		}).append(
			Frontend.dom.canvas =
			$('<canvas>', {
				'id': 'game-canvas'
			}).attr({
				'width': '640',
				'height': '480'
			}).append(
				$('<h2>', {
					'text': 'Your browser doesn\'t support the new HTML5 <canvas> element.'
				})
			).append(
				$('<p>', {
					'text': 'Try getting a real browser from Google: '
				}).append(
					$('<a>', {
						'href': 'http://www.google.com/chrome/',
						'text': 'http://www.google.com/chrome/'
					})
				)
			)
		).append(
			Frontend.dom.levelListContainer =
			$('<div>', {
				'id': 'level-list-container',
				'class': 'ui-dialog ui-widget'
			}).hide().append(
				$('<div>', {
					'class': 'ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix',
					'style': 'cursor: default; margin: 10px;'
				}).append(
					$('<span>', {
						'class': 'ui-dialog-title',
						'text': 'Level list'
					})
				).append(
					$('<a>', {
						'href': '#',
						'class': 'ui-dialog-titlebar-close ui-corner-all',
						'role': 'button',
						'mouseenter': function(){
							$(this).addClass('ui-state-hover');
						},
						'mouseleave': function(){
							$(this).removeClass('ui-state-hover');
						},
						'click': function(){
							Frontend.dom.levelListButton.click();
							return false;
						}
					}).append(
						$('<span>', {
							'class': 'ui-icon ui-icon-closethick',
							'text': 'close'
						})
					)
				)
			).append(
				$('<div>', {
					'class': 'ui-dialog-content ui-widget-content'
				}).append(
					(function(){
						var thRow = $('<tr />');
						['ID', 'Updated', 'Name', 'Description', 'Author ID', 'Author'].forEach(function(name){
							thRow.append(
								$('<th>', {
									'text': name
								})
							);
						});
						
						Frontend.dom.levelList =
						$('<table>', {
							'id': 'level-list',
							'cellspacing': '0'
						}).append(
							$('<thead />').append(thRow.clone())
						).append(
							$('<tbody />')
						).append(
							$('<tfoot />').append(thRow.clone())
						);
						
						setTimeout(function(){
							Frontend.dom.levelList.dataTable({
								'bProcessing': true,
								'sAjaxSource': 'api.php?action=getLevelList',
								'bJQueryUI': true,
								'sPaginationType': 'full_numbers',
								'sAjaxDataProp': 'levels',
								'aoColumns': [
									{'mDataProp': 'id' ,		'bVisible' : false},
									{'mDataProp': 'updated',	'sWidth': '20%', 
										'fnRender': function(oObj){
											return relative_time(new Date(parseInt(oObj.aData.updated)*1000));
										}
									},
									{'mDataProp': 'name' ,		'sWidth': '30%'},
									{'mDataProp': 'desc' ,		'sWidth': '35%'},
									{'mDataProp': 'user_id',	'bVisible': false},
									{'mDataProp': 'username',	'sWidth': '15%'}
								],
								'bAutoWidth': false
							});
							
							$('tbody', Frontend.dom.levelList).click(function(event){
								Frontend.dom.levelList.fnGetNodes().forEach(function(el){
									$(el).removeClass('selected');
								});
								$(event.target.parentNode).addClass('selected');
								
								Frontend.dom.levelList.fnGetNodes().forEach(function(el, i){
									if ( $(el).hasClass('selected') ){
										Frontend.loadLevel(Frontend.dom.levelList.fnGetData(i).id);
										Frontend.dom.levelListButton.click();
										return false;
									}
								});
							});
						}, 0);
						
						return Frontend.dom.levelList;
					})()
				)
			)
		)
	).append(
		Frontend.dom.cache =
		$('<div>', {
			'id': 'game-cache'
		}).hide()
	);

	// Set up canvas autoscaling
	$(window).resize(function(){
		// Reset panel width to that defined in the stylesheet
		Frontend.dom.sidePanel.css('width', '');

		// Set default gameArea width
		Frontend.dom.gameArea.width( Frontend.dom.core.innerWidth() - Frontend.dom.sidePanel.outerWidth() );
		Frontend.dom.gameArea.css('margin-left', Frontend.dom.sidePanel.outerWidth());


		if ( Frontend.dom.gameArea.innerWidth()/Frontend.dom.canvas.attr('width') < Frontend.dom.gameArea.innerHeight()/Frontend.dom.canvas.attr('height') ){
			// Limited by width
			Frontend.dom.canvas.css({
				'width': '100%',
				'height': 'auto'
			});
		}
		else{
			// Limited by height
			Frontend.dom.canvas.css({
				'width': 'auto',
				'height': '100%'
			});

			// Expand sidePanel to the unused spaced, to a maximum width of 250
			Frontend.dom.sidePanel.width(Math.min(250, Frontend.dom.core.innerWidth() - Frontend.dom.canvas.width()));
			Frontend.dom.gameArea.width( Frontend.dom.core.innerWidth() - Frontend.dom.sidePanel.outerWidth() );
			Frontend.dom.gameArea.css('margin-left', Frontend.dom.sidePanel.outerWidth());
		}
	}).resize();
	
	// Disable selection for certain UI elements
	$('.button, #gamemode-tabs > *, #level-list-button').attr('unselectable', 'on').live('mousedown selectstart', function(){
		return false;
	});
	
	// Initialize canvas
	Frontend.dom.canvas[0].focus();
	Frontend.cache.canvasContext = Frontend.dom.canvas[0].getContext('2d');
	
	// Initialize game
	Frontend.setGameMode('play');
	World.init(Frontend.dom.canvas[0], Frontend.dom.cache[0]);

	// Load session and start game
	Frontend.session.init(undefined, function(){
		Frontend.loadLevel(1);
	});
};
