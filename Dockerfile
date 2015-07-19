# Dockerfile to build the image for the actual server part.
# This includes setting up nodejs (by virtue of extending
# its image), as well as installing all dependencies 
# required by the server to function (npm install).
#
# There is an associated .dockerignore that will preclude
# the node_modules folder from being pushed into the 
# image's filesystem.

# Based on nodejs v. 0.12.7
FROM node:0.12.7-wheezy

# Expose ports 8080 and 8443 for http and https, respectively
EXPOSE 8080
EXPOSE 8443

# Copy current directory into the image at /srv/
# ADD . /srv/

# Server source files will be mounted at /srv
VOLUME /srv
WORKDIR ./srv

# Install dependencies
#RUN npm install --production

# Run the server when the associated container is started
CMD node /srv/bin/www