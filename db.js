const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/pi/Downloads/polly_poc/blogs');
const Q = require('q');

const TABLE_NAME = "posts_read";

exports.checkIfReadOrSavePost = function(blog, title){
	const deferred = Q.defer();
	exports.hasPostBeenRead(blog, title).then(function(result){
		if( !result )
			db.run(`insert into ${TABLE_NAME} (blog, title) values (\"${blog}\", \"${title}\")`);
		deferred.resolve(result);
	});
	return deferred.promise;
};

exports.hasPostBeenRead = function(blog, title){
	const deferred = Q.defer();
	db.all(`select count(1) as c from ${TABLE_NAME} where blog = \"${blog}\" and title = \"${title}\"`, (err, rows) => {
		const count = rows[0].c;
		if( rows[0].c == 0 )
			deferred.resolve(false);
		else
			deferred.resolve(true);
	});
	return deferred.promise;
};
