# polly_poc

Proof of concept for Polly AWS

This requires a ```~/.aws/credentials``` file per ```aws-sdk``` dependency.  Please see their documentation for details.

The ```speaker``` dependency needs this installed for Ubuntu: ```$ sudo apt-get install libasound2-dev``` .  Install that first before ```npm i```

For Ubuntu output to 3.5mm jack (instead of HDMI):

```amixer cset numid=3 1```

sqlite3 db:

create table posts_read (blog TEXT, title TEXT, date_published DATE, time_read DATETIME)