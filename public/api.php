<?php

require_once('config.php');
require_once('recaptchalib.php');

function reqparam($key){
	if ( isset($_REQUEST[$key]) )
		return $_REQUEST[$key];
	return '';
}

function output($data){
	if ( is_bool($data) )
		$data = array('ok'=>$data);
	
	die(json_encode($data));
}
function error($text, array $stuff=array()){
	output(array_merge(array(
		'error' => $text
	), $stuff));
}

$dbh = new PDO(
		"mysql:host={$plethora_mysql['host']};dbname={$plethora_mysql['database']}",
		$plethora_mysql['username'],
		$plethora_mysql['password']
);

function sql($query, array $params = array(), $numToFetch = null){
	global $dbh;
	
	if ( count($params) > 0 ){
		$stmt = $dbh->prepare($query);
		if ( !$stmt->execute($params) )
			return false;
	}
	else
		$stmt = $dbh->query($query);
	
	if ( !$stmt )
		return false;
	
	if ( $numToFetch === 0 )
		return true;
	
	$results = array();
	while ( $row = $stmt->fetch(PDO::FETCH_ASSOC) )
		$results []= $row;
	
	if ( $numToFetch === 1 )
		return $results[0];
	elseif ( $numToFetch > 0 )
		return array_slice($results, 0, $numToFetch);
	
	return $results;
}

function checkCaptcha(){
	global $plethora_recaptcha;
	
	return recaptcha_check_answer($plethora_recaptcha['private'], $_SERVER['REMOTE_ADDR'], reqparam('captcha_challenge'), reqparam('captcha_response'));
}

function handleRequest($action){
	switch ( $action ){
		case 'getSessionData':
			// Get user info
			$data = sql('SELECT users.id, users.username, sessions.id AS sid FROM users, sessions WHERE sessions.id=:sid AND users.id=sessions.user_id LIMIT 1', array(
				':sid' => reqparam('sid')
			), 1);
			
			if ( !empty($data) )
				output($data);
			else
				error('Invalid session!');
		break;
		case 'logout':
			sql('DELETE FROM sessions WHERE id=:sid LIMIT 1', array(
				':sid' => reqparam('sid')
			), 0);
			
			output(true);
		break;
		case 'login':
			// Get user info
			$data = sql('SELECT id, username FROM users WHERE username=:username AND password=:password LIMIT 1', array(
				':username' => reqparam('username'),
				':password' => reqparam('password')
			), 1);
			
			if ( !empty($data) ){
				// Create a new session
				$data['sid'] = uniqid('', true);
				sql('INSERT INTO sessions (id, user_id) VALUES(:sid, :uid)', array(
					':sid' => $data['sid'],
					':uid' => $data['id']
				), 0);
				
				// Limit to 5 open sessions per user
				sql('DELETE FROM sessions WHERE user_id=:uid AND id NOT IN ( SELECT id FROM ( SELECT id FROM sessions WHERE user_id=:uid ORDER BY created DESC LIMIT 5 ) foo )', array(
					':uid' => $data['id']
				), 0);
				
				output($data);
			}
			else
				error('Invalid username or password!');
		break;
		case 'register':
			// Check captcha
			$resp = checkCaptcha();
			if ( !$resp->is_valid )
				error('Invalid CAPTCHA answer!');
			
			// Check if username exists
			$data = sql('SELECT * FROM users WHERE username=:username LIMIT 1', array(
				':username' => reqparam('username')
			));
			if ( count($data) > 0 )
				error('Username already taken!');
			
			// Create new user
			sql('INSERT INTO users (username, password) VALUES(:username, :password)', array(
				':username' => reqparam('username'),
				':password' => reqparam('password')
			), 0);

			return handleRequest('login');
		break;
		default:
			error('Invalid action');
	}
}

handleRequest(reqparam('action'));
