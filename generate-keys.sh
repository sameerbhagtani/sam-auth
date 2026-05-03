#!/bin/bash

# set the directory where certificates will be stored
CERT_DIR="cert"

# create the directory if it does not exist
mkdir -p "$CERT_DIR"

# generate the private key (RSA 2048-bit)
openssl genpkey -algorithm RSA -out "$CERT_DIR/private-key.pem" -pkeyopt rsa_keygen_bits:2048

# generate the public key from the private key
openssl rsa -in "$CERT_DIR/private-key.pem" -pubout -out "$CERT_DIR/public-key.pub"

# print success message
echo "Keys have been generated in the $CERT_DIR/ folder."
