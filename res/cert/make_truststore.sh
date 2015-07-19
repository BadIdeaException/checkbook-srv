#!/bin/bash
/usr/lib/jvm/java-1.7.0-openjdk-amd64/bin/keytool -importcert -v -trustcacerts -file "checkbook-server-cert.pem" -alias ca -keystore "truststore.bks" -provider org.bouncycastle.jce.provider.BouncyCastleProvider -providerpath "./bcprov-jdk15on-146.jar" -storetype BKS
