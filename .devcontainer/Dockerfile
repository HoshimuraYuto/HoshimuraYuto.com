FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

RUN apt-get update \
    && apt-get install -y python3-pip

RUN pip3 install mecab-python3 scikit-learn unidic-lite
