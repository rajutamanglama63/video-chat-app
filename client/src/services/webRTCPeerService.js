export class WebRTCPeerService {
  constructor() {
    // RTCPeerConnection is built in web api provided by modern web browser to established peer to peer -
    // - connection for real time communication such as audio and video
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun: stul.l.google.com: 19302",
              "stun: global.stun.twilio.com: 3478",
            ],
          },
        ],
      });
    }
  }

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(new RTCSessionDescription(offer));

      return offer;
    }
  }
}

// export default new WebRTCPeerService();
