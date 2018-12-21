module.exports = {
    transform : (file_contents) =>
    {
        let urls = file_contents.split("\n").filter(item => !!item.trim());
        let data = urls.map(item =>
        {
            let split_item = item.split(",");
            let date;
            let url;
            split_item.filter(item => !!item.trim()).forEach(item =>
            {
                if (/^\d{1,2}\/\d{1,2}\/\d{1,2}$/.test(item))
                    date = item;
                if (/^(http(s)?\:\/\/|www\.)/.test(item))
                    url = item
            });

            return {
                ...(date ? {date: date} : ""),
                ...(url ? {url: url} : "")
            }

        });
        return {urls: data}
    }
};