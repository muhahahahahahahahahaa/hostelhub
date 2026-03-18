
export const validateEmail = (email) =>{
    if (!email.trim()) return 'Email is required,';
    const emailRedex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRedex.test(email)) return 'Please enter a valid email address.';
    return '';
};
export const validatePassword = (password) =>{
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (!/(?=.*[a-z])/.test(password))
        return 'Password must contain at least one lowercase letter.';
    if (!/(?=.*[A-Z])/.test(password))
        return 'Password must contain at least one uppercase letter.';
    if (!/(?=.*\d)/.test(password))
        return 'Password must contain at least one number.';
    return "";
};
export const validateAvatar = (file) =>{
    if (!file) return"";// avatar is optional
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)){
        return "Avatar must be a JPEG or PNG image.";
    }
    const maxSizeInBytes = 5 * 1024 * 1024; //5MB
    if (file.size > maxSizeInBytes){
        return "Avatar size must be less than 5MB.";
    }
    return "";
}

export const getInitials = (name)=> {
    return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
}