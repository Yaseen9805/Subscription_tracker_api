export const withoutPassword = (userDoc) => {
    const plain = userDoc.toObject();
    delete plain.password;
    return plain;
};
