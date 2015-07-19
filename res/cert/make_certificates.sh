#!/bin/bash
openssl req -x509 -nodes -newkey rsa:1024 -keyout checkbook-server-key.pem -out checkbook-server-cert.pem -config checkbook-server-openssl.cnf
