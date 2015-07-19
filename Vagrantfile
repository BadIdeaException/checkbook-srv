# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "ubuntu/trusty64"

  # Disable default share of current folder as /vagrant
  config.vm.synced_folder ".", "/vagrant", disabled: true

  # Share project folder as /home/checkbook-srv
  config.vm.synced_folder ".", "/home/checkbook-srv"

  # Workaround for the "stdin is not a tty" bug.
  # See https://github.com/mitchellh/vagrant/issues/1673 
  # and http://foo-o-rama.com/vagrant--stdin-is-not-a-tty--fix.html
  #config.vm.provision "shell" do |shell|
  #  shell.privileged = false
  #  shell.name = "Workaround for stdin is not a tty bug"
  #  shell.inline = "sudo sed -i '/tty/!s/mesg n/tty -s \\&\\& mesg n/' /root/.profile"
  #end

  # Install nodejs
  # Even though the server runs virtualized in a docker container, 
  # nodejs is still needed to run grunt, npm etc. in the 
  # development environment
  config.vm.provision "shell" do |shell|
    shell.name = "Install node.js"
    shell.inline = "curl -sL https://deb.nodesource.com/setup | bash - && apt-get install -y nodejs"
  end

  # Install docker and docker-compose
  # Add vagrant user to docker group to enable running docker
  # without needing root privileges
  #config.vm.provision "shell" do |shell|
  #  shell.name = "Install docker and docker-compose"
  #  shell.inline = "<<END
  #    wget -qO- https://get.docker.com/ | bash 
  #    curl -L https://github.com/docker/compose/releases/download/1.3.1/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose 
  #    chmod +x /usr/local/bin/docker-compose 
  #    usermod -aG docker vagrant
#END"
  #end

  # Pull and start dockerized postgres
  config.vm.provision "docker" do |docker|
    docker.pull_images "postgres:9.4"
    docker.run "postgres:9.4",
      args: "--name='postgres' --hostname='postgres' --publish='5432:5432' --volume='/home/checkbook-data:/var/lib/postgresql/data'"
  end

  # Build image checkbook-srv from Dockerfile, then install project dependencies
  config.vm.provision "docker" do |docker|
    docker.build_image "/home/checkbook-srv", args: "--tag='checkbook-srv'"
    # Install project dependencies
    docker.run "checkbook-srv",
      cmd: "/bin/bash -c 'npm install'",
      daemonize: false,
      restart: "no",
      args: "--name='npm-install' --volume='/home/checkbook-srv:/srv'"
  end

  # Initialize database(s)
  config.vm.provision "docker" do |docker|
    docker.run "checkbook-srv",
      cmd: "/srv/bin/init",
      daemonize: false,
      restart: "no",
      args: "--name='init' --volume='/home/checkbook-srv:/srv' --link='postgres:postgres'"
  end

  # And finally, run the server
  config.vm.provision "docker" do |docker|
    docker.run "checkbook-srv",
      args: "--name='checkbook-srv' --hostname='srv' --publish='8080:8080' --publish='8443:8443' --volume='/home/checkbook-srv:/srv' --link='postgres:postgres'"
  end

  # Install psql
  config.vm.provision "shell", name: "Install psql", inline: "apt-get install -y postgresql-client" 
end

