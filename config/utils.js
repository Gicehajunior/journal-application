const utility = {
    ucwords: (str) => {
        return str
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },
    ucfirst: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
}

module.exports = utility;
