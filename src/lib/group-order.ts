import type { IGroupOrder } from "@/models/GroupOrder";

type MaybeObjectId = {
  _id?: { toString(): string } | string;
  toString?: () => string;
} | string | null | undefined;

function asId(value: MaybeObjectId) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return typeof value._id === "string" ? value._id : value._id.toString();
  return value.toString ? value.toString() : "";
}

function asPlainRecord(value: unknown): Record<string, unknown> {
  return (value as Record<string, unknown>) ?? {};
}

export function serializeGroupOrder(groupOrder: IGroupOrder | Record<string, unknown>) {
  const source =
    typeof (groupOrder as { toObject?: () => Record<string, unknown> }).toObject === "function"
      ? (groupOrder as { toObject: () => Record<string, unknown> }).toObject()
      : asPlainRecord(groupOrder);

  const restaurant = asPlainRecord(source.restaurantId ?? source.restaurant);
  const creator = asPlainRecord(source.createdBy ?? source.creator);
  const participants = Array.isArray(source.participants) ? source.participants : [];

  const serializedParticipants = participants.map((participant) => {
    const participantRecord = asPlainRecord(participant);
    const user = asPlainRecord(participantRecord.userId);
    const items = Array.isArray(participantRecord.items) ? participantRecord.items : [];

    return {
      userId: asId((user._id ?? participantRecord.userId) as MaybeObjectId),
      name:
        (typeof user.name === "string" && user.name) ||
        (typeof participantRecord.name === "string" && participantRecord.name) ||
        "Participant",
      subtotal: Number(participantRecord.subtotal ?? 0),
      paymentStatus:
        typeof participantRecord.paymentStatus === "string"
          ? participantRecord.paymentStatus
          : "PENDING",
      itemCount: items.reduce((count, item) => {
        const quantity = Number(asPlainRecord(item).quantity ?? 0);
        return count + quantity;
      }, 0),
      items: items.map((item) => {
        const itemRecord = asPlainRecord(item);
        return {
          menuItemId: asId(itemRecord.menuItemId as MaybeObjectId),
          name: typeof itemRecord.name === "string" ? itemRecord.name : "Item",
          price: Number(itemRecord.price ?? 0),
          quantity: Number(itemRecord.quantity ?? 0),
        };
      }),
    };
  });

  const aggregatedItems = serializedParticipants.flatMap((participant) =>
    participant.items.map((item) => ({
      ...item,
      user: {
        _id: participant.userId,
        name: participant.name,
      },
      lineTotal: item.price * item.quantity,
    }))
  );

  const equalShare = serializedParticipants.length > 0
    ? Number((Number(source.totalAmount ?? 0) / serializedParticipants.length).toFixed(2))
    : 0;

  return {
    _id: asId(source._id as MaybeObjectId),
    inviteCode: typeof source.inviteCode === "string" ? source.inviteCode : "",
    status: typeof source.status === "string" ? source.status : "OPEN",
    totalAmount: Number(source.totalAmount ?? 0),
    createdAt:
      source.createdAt instanceof Date
        ? source.createdAt.toISOString()
        : String(source.createdAt ?? ""),
    creator: {
      _id: asId((creator._id ?? source.createdBy) as MaybeObjectId),
      name:
        (typeof creator.name === "string" && creator.name) ||
        serializedParticipants[0]?.name ||
        "Host",
    },
    restaurant: {
      _id: asId((restaurant._id ?? source.restaurantId) as MaybeObjectId),
      name: typeof restaurant.name === "string" ? restaurant.name : "Restaurant",
      logo: typeof restaurant.logo === "string" ? restaurant.logo : undefined,
      address: typeof restaurant.address === "string" ? restaurant.address : "",
      city: typeof restaurant.city === "string" ? restaurant.city : "",
      rating: Number(restaurant.rating ?? 0),
    },
    participants: serializedParticipants,
    items: aggregatedItems,
    splitPreview: {
      equalShare,
      byItem: serializedParticipants.map((participant) => ({
        userId: participant.userId,
        name: participant.name,
        amountOwed: participant.subtotal,
      })),
    },
  };
}
