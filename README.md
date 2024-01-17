# 大文件分片上传

当文件比较大的时候，文件上传会很慢，这时候一般我们会通过分片的方式来优化。

原理就是浏览器里通过 slice 来把文件分成多个分片，并发上传。

服务端把这些分片文件保存在一个目录下。

当所有分片传输完成时，发送一个合并请求，服务端通过 fs.createWriteStream 指定 start 位置，来把这些分片文件写入到同一个文件里，完成合并。

这样，我们就实现了大文件分片上传。