

# Checkbook-srv

## Goals

This is a complete rewrite of the backend of the Checkbook project. The goals of the rewrite were:

**1. Clean up the code.** Let's face it - the first version, being a learning project, was a bit of a mess. So the rewrite was intended to clean up a bit. One step toward this was the use of Sequelize as an ORM.

**2. More tests.** Follow good practice, and test the backend extensively. Cleaner code also helped with this.

**3. Virtualize.** The rewrite is open to virtualization, so both the backend server itself as well as the database server can live in Docker containers quite happily.

## Usage

The project is all set up and configured to be run in a Vagrant environment. All you have to do is run ``vagrant up``, then lean back while the environment is set up. Or better yet, go and grab a coffee, because it might take a few minutes.

But before you do, be sure to fill out the ``database.json`` and ``mail.json`` files in the config directory. Examples are provided, you just need to rename them.

The server (including the database server) will automatically start when the Vagrant virtual machine is started.

## Tests

From within the Vagrant virtual machine, run ``npm test``. It will automatically start up a docker container and run the tests against it.
