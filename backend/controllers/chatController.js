const Chat = require("../models/Chat");
const Inquiry = require("../models/Inquiry");
const Listing = require("../models/Listing");

const CHAT_POPULATION = [
    {
        path: "listing",
        select: "title location roomType category owner isClosed images",
    },
    {
        path: "owner",
        select: "name email avatar hostelName hostelLogo role",
    },
    {
        path: "renter",
        select: "name email avatar role",
    },
    {
        path: "messages.sender",
        select: "name email avatar hostelName hostelLogo role",
    },
];

const normalizeMessage = (value) => String(value || "").trim();

const isOwnerParticipant = (chat, userId) =>
    String(chat.owner?._id || chat.owner) === String(userId);

const canAccessChat = (chat, userId) => {
    const normalizedUserId = String(userId);
    return (
        String(chat.owner?._id || chat.owner) === normalizedUserId ||
        String(chat.renter?._id || chat.renter) === normalizedUserId
    );
};

const decorateChat = (chat, userId) => {
    const chatObject = typeof chat.toObject === "function" ? chat.toObject() : chat;
    const isOwner = isOwnerParticipant(chatObject, userId);

    return {
        ...chatObject,
        unreadCount: isOwner ? chatObject.ownerUnreadCount : chatObject.renterUnreadCount,
        otherParticipant: isOwner ? chatObject.renter : chatObject.owner,
        isOwnerParticipant: isOwner,
        messageCount: chatObject.messages?.length || 0,
    };
};

const buildInquiryKey = (listingId, renterId) => `${listingId}-${renterId}`;

const attachInquiriesToDecoratedChats = async (chats, userId) => {
    if (!Array.isArray(chats) || chats.length === 0) {
        return [];
    }

    const decoratedChats = chats.map((chat) => decorateChat(chat, userId));
    const inquiryFilters = decoratedChats
        .map((chat) => {
            const listingId = chat.listing?._id || chat.listing;
            const renterId = chat.renter?._id || chat.renter;

            if (!listingId || !renterId) {
                return null;
            }

            return {
                listing: listingId,
                renter: renterId,
            };
        })
        .filter(Boolean);

    if (inquiryFilters.length === 0) {
        return decoratedChats.map((chat) => ({ ...chat, inquiry: null }));
    }

    const inquiries = await Inquiry.find({
        $or: inquiryFilters,
    }).select("_id listing renter status");

    const inquiryMap = new Map(
        inquiries.map((inquiry) => [
            buildInquiryKey(
                String(inquiry.listing?._id || inquiry.listing),
                String(inquiry.renter?._id || inquiry.renter)
            ),
            {
                _id: inquiry._id,
                status: inquiry.status,
            },
        ])
    );

    return decoratedChats.map((chat) => {
        const listingId = String(chat.listing?._id || chat.listing || "");
        const renterId = String(chat.renter?._id || chat.renter || "");

        return {
            ...chat,
            inquiry: inquiryMap.get(buildInquiryKey(listingId, renterId)) || null,
        };
    });
};

const attachInquiryToDecoratedChat = async (chat, userId) => {
    const [decoratedChat] = await attachInquiriesToDecoratedChats([chat], userId);
    return decoratedChat || null;
};

const populateChat = (chatQuery) => chatQuery.populate(CHAT_POPULATION);

const markInquiryAsContacted = async (chat, ownerSending) => {
    if (!ownerSending) {
        return;
    }

    await Inquiry.updateOne(
        {
            listing: chat.listing,
            renter: chat.renter,
            status: "New",
        },
        {
            $set: {
                status: "Contacted",
            },
        }
    );
};

const getAuthorizedChatContext = async ({ requester, listingId, renterId }) => {
    const listing = await Listing.findById(listingId).select("owner isClosed");

    if (!listing) {
        return { error: { status: 404, message: "Listing not found" } };
    }

    if (String(listing.owner) === requester._id.toString() && requester.role === "renter") {
        return { error: { status: 400, message: "You cannot chat on your own listing" } };
    }

    let targetRenterId = renterId || requester._id;

    if (requester.role === "owner") {
        if (String(listing.owner) !== requester._id.toString()) {
            return {
                error: { status: 403, message: "Not authorized to access chats for this listing" },
            };
        }

        if (!renterId) {
            return { error: { status: 400, message: "Renter is required" } };
        }

        targetRenterId = renterId;
    }

    const existingChat = await Chat.findOne({
        listing: listing._id,
        renter: targetRenterId,
    });

    if (existingChat) {
        return { listing, targetRenterId, existingChat };
    }

    const existingInquiry = await Inquiry.findOne({
        listing: listing._id,
        renter: targetRenterId,
    }).select("_id");

    if (requester.role === "owner" && !existingInquiry) {
        return {
            error: {
                status: 400,
                message: "This renter has not sent an inquiry for the listing yet",
            },
        };
    }

    if (requester.role === "renter" && listing.isClosed && !existingInquiry) {
        return {
            error: {
                status: 400,
                message: "This listing is closed and cannot accept new chats",
            },
        };
    }

    return { listing, targetRenterId, existingChat: null };
};

exports.accessChat = async (req, res) => {
    try {
        const { listingId, renterId } = req.body;

        if (!listingId) {
            return res.status(400).json({ message: "Listing is required" });
        }

        const context = await getAuthorizedChatContext({
            requester: req.user,
            listingId,
            renterId,
        });

        if (context.error) {
            return res.status(context.error.status).json({ message: context.error.message });
        }

        let chat = context.existingChat;

        if (!chat) {
            chat = await Chat.create({
                listing: context.listing._id,
                owner: context.listing.owner,
                renter: context.targetRenterId,
            });
        }

        const populatedChat = await populateChat(Chat.findById(chat._id));

        res.json(await attachInquiryToDecoratedChat(populatedChat, req.user._id));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMyChats = async (req, res) => {
    try {
        const filter =
            req.user.role === "owner"
                ? { owner: req.user._id }
                : { renter: req.user._id };

        const chats = await populateChat(
            Chat.find(filter).sort({ lastMessageAt: -1, updatedAt: -1 })
        );

        res.json(await attachInquiriesToDecoratedChats(chats, req.user._id));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getChatById = async (req, res) => {
    try {
        let chat = await populateChat(Chat.findById(req.params.id));

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if (!canAccessChat(chat, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to view this chat" });
        }

        const ownerView = isOwnerParticipant(chat, req.user._id);
        const unreadField = ownerView ? "ownerUnreadCount" : "renterUnreadCount";

        if (chat[unreadField] > 0) {
            chat[unreadField] = 0;
            await chat.save();
            chat = await populateChat(Chat.findById(req.params.id));
        }

        res.json(await attachInquiryToDecoratedChat(chat, req.user._id));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.sendMessageForListing = async (req, res) => {
    try {
        if (req.user.role !== "renter") {
            return res.status(403).json({ message: "Only renters can start chats from listings" });
        }

        const text = normalizeMessage(req.body.message);
        if (!text) {
            return res.status(400).json({ message: "Message is required" });
        }
        if (text.length > 1000) {
            return res.status(400).json({ message: "Message is too long" });
        }

        const context = await getAuthorizedChatContext({
            requester: req.user,
            listingId: req.params.listingId,
        });

        if (context.error) {
            return res.status(context.error.status).json({ message: context.error.message });
        }

        let chat = context.existingChat;
        const isNewChat = !chat;

        if (!chat) {
            chat = new Chat({
                listing: context.listing._id,
                owner: context.listing.owner,
                renter: context.targetRenterId,
            });
        }

        chat.messages.push({
            sender: req.user._id,
            text,
        });
        chat.lastMessage = text;
        chat.lastMessageAt = new Date();
        chat.ownerUnreadCount += 1;
        chat.renterUnreadCount = 0;

        await chat.save();

        const populatedChat = await populateChat(Chat.findById(chat._id));

        res
            .status(isNewChat ? 201 : 200)
            .json(await attachInquiryToDecoratedChat(populatedChat, req.user._id));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const text = normalizeMessage(req.body.message);
        if (!text) {
            return res.status(400).json({ message: "Message is required" });
        }
        if (text.length > 1000) {
            return res.status(400).json({ message: "Message is too long" });
        }

        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if (!canAccessChat(chat, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to send messages here" });
        }

        const ownerSending = isOwnerParticipant(chat, req.user._id);

        chat.messages.push({
            sender: req.user._id,
            text,
        });
        chat.lastMessage = text;
        chat.lastMessageAt = new Date();

        if (ownerSending) {
            chat.renterUnreadCount += 1;
            chat.ownerUnreadCount = 0;
        } else {
            chat.ownerUnreadCount += 1;
            chat.renterUnreadCount = 0;
        }

        await chat.save();
        await markInquiryAsContacted(chat, ownerSending);

        const populatedChat = await populateChat(Chat.findById(chat._id));

        res.json(await attachInquiryToDecoratedChat(populatedChat, req.user._id));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
