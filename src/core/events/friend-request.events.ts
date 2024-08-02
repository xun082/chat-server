export class FriendRequestEvent {
  constructor(
    public readonly senderEmail?: string,
    public readonly receiverEmail?: string,
    public readonly description?: string,
  ) {}
}
