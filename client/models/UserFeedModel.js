import statusEnum from '../models/enums';

function UserFeedModel(feedObject, options = {}) {
  this.feedId =
    options.objectType && options.objectType === 'feedModelObject'
      ? feedObject.feedId
      : +feedObject.id;
  this.name = feedObject.name;
  this.description = feedObject.description;
  this.url = feedObject.url;
  this.favoriteIndex = 0;
  this.faviconFile = feedObject.faviconFile;

  // status
  this.statusSubscribe = options.statusSubscribe || statusEnum.SUCCESS;
  this.statusUnsubscribe = options.statusUnsubscribe || statusEnum.NOT_LOADED;
}

export default UserFeedModel;
