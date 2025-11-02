FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y build-essential git python3 python3-pip nodejs npm sox wget ca-certificates
WORKDIR /opt/offline-ai
COPY . /opt/offline-ai
WORKDIR /opt/offline-ai/backend
RUN npm install
# Note: building llama.cpp and whisper.cpp in container can be heavy; run setup script if desired
CMD ["node", "server.js"]
