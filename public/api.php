<?php

include('config.php');

function reqparam($key){
	if ( isset($_REQUEST[$key]) )
		return $_REQUEST[$key];
	return '';
}

function output($data){
	die(json_encode($data));
}
function error($text){
	output(array(
		'error' => $text
	));
}

$sql = new mysqli($plethora_mysql['host'], $plethora_mysql['username'], $plethora_mysql['password'], $plethora_mysql['database'], $plethora_mysql['port']);

function handleRequest($action){
	global $sql;
	
	switch ( $action ){
		case 'getSessionData':
			// Get user info
			$stmt = $sql->prepare('SELECT users.id, users.username, sessions.id AS sid FROM users, sessions WHERE sessions.id=? AND users.id=sessions.user_id LIMIT 1');
			@$stmt->bind_param('s', reqparam('sid'));
			$stmt->execute();
			$result = $stmt->get_result();
			
			if ( $result->num_rows > 0 ){
				$data = $result->fetch_assoc();
				
				output($data);
			}
			else{
				error('Invalid session!');
			}
		break;
		case 'login':
			// Get user info
			$stmt = $sql->prepare('SELECT id, username FROM users WHERE username=? AND password=? LIMIT 1');
			@$stmt->bind_param('ss', reqparam('username'), reqparam('password'));
			$stmt->execute();
			$result = $stmt->get_result();

			if ( $result->num_rows > 0 ){
				$data = $result->fetch_assoc();
				
				// Create a new session
				$data['sid'] = uniqid('', true);
				$stmt = $sql->prepare('INSERT INTO sessions (id, user_id) VALUES(?, ?)');
				$stmt->bind_param('ss', $data['sid'], $data['id']);
				$stmt->execute();
				
				// Limit to 5 open sessions per user
				$stmt = $sql->prepare('DELETE FROM sessions WHERE user_id=? AND id NOT IN ( SELECT id FROM ( SELECT id FROM sessions WHERE user_id=? ORDER BY created DESC LIMIT 5 ) foo )');
				$stmt->bind_param('ss', $data['id'], $data['id']);
				$stmt->execute();
				
				output($data);
			}
			else{
				error('Invalid username or password!');
			}
		break;
		case 'register':
			// Check if username exists
			$stmt = $sql->prepare('SELECT * FROM users WHERE username=? LIMIT 1');
			@$stmt->bind_param('s', reqparam('username'));
			$stmt->execute();
			$result = $stmt->get_result();
			if ( $result->num_rows > 0 )
				error('Username already taken!');
			
			// Create new user
			$stmt = $sql->prepare('INSERT INTO users (username, password) VALUES(?, ?)');
			@$stmt->bind_param('ss', reqparam('username'), reqparam('password'));
			$stmt->execute();

			return handleRequest('login');
		break;
		default:
			error('Invalid action');
	}
}

handleRequest(reqparam('action'));
