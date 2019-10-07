function FeedModel(rawFeed) {
  this.feedId = +rawFeed.id;
  this.name = rawFeed.name;
  this.description = rawFeed.description;
  this.url = rawFeed.url;
  this.faviconFile = rawFeed.faviconFile;
}

export default FeedModel;
