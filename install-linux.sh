#!/bin/sh

sudo -i
apt-get update

# install git and dependencies
apt-get install g++ curl libssl-dev apache2-utils
apt-get install git-core

# install node / npm
git clone git://github.com/ry/node.git
cd node
./configure
make
make install

# install redis
apt-get install redis-server

# install mongodb
mkdir -p /data/db
apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' > /etc/apt/sources.list.d/10gen.list
apt-get update
apt-get install mongodb-10gen

# install the application from git
# ssh-keygen -q -t rsa -C 'steve.g.messina@gmail.com'
# cat ~/.ssh/id_rsa.pub > xclip
git clone https://github.com/velniukas/trendinvesting.git

# download the node packages locally
npm install -d

# start the services
service mongodb start
service redis-server start

# start the app
cd trendinvesting
nodemon server.js
