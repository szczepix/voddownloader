var TVN = (function() {
    var properties = new Configurator({
        wrapper: {
            selector: '#player-container, div.custom-alert-inner-wrapper'
        },
        button: {
            class: 'btn btn-primary tvn_download_button'
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'http://player.pl/api/?platform=ConnectedTV&terminal=Panasonic&format=json' +
                        '&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=#videoId',
                    beforeStep: function(input){
                        return idParser();
                    },
                    afterStep: function(output) {
                        return grabVideoData(output);
                    }
                })
            ]
        },
    });

    var idParser = function(){
        var watchingNow = $('.watching-now').closest('.embed-responsive').find('.embed-responsive-item');
        if(watchingNow.length > 0){
            return watchingNow.attr('href').split(',').pop();
        }

        return episodeIdParser();
    };

    var episodeIdParser = function () {
        var match = window.location.href.match(/odcinki,(\d+)\/.*,(\d+)/);
        if(match && match[2]){
            return match[2];
        }

        return serialIdParser();
    };

    var serialIdParser = function () {
        var match = window.location.href.match(/odcinki,(\d+)/);
        if(match && match[1]){
            throw new Exception(config.error.tvnId, Tool.getRealUrl());
        }

        return vodIdParser();
    };

    var vodIdParser = function(){
        var match = window.location.href.match(/,(\d+)/);
        if(match && match[1]){
            return match[1];
        }

        throw new Exception(config.error.tvnId, Tool.getRealUrl());
    };

    var grabVideoData = function(data){
        var items = [];
        var main = ((data.item || {}).videos || {}).main || {};
        var video_content = main.video_content || {};
        if(main.video_content_license_type !== 'WIDEVINE' && video_content && video_content.length > 0){
            $.each(video_content, function( index, value ) {
                items.push(Tool.mapDescription({
                    source: 'TVN',
                    key: value.profile_name,
                    video: value.profile_name,
                    url: value.url
                }));
            });

            return {
                title: getTitle(data),
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
    };

    var getTitle = function(data){
        var episode = data.item.episode ? 'E'+Tool.pad(data.item.episode, 2) : '';
        var season = data.item.season != null ? 'S'+Tool.pad(data.item.season, 2) : '';
        var serie_title = data.item.serie_title != null ? data.item.serie_title : '';
        var episodeTitle = data.item.title ? ' ' + data.item.title : '';
        var seasonAndEpisode = season + episode;

        return serie_title + (seasonAndEpisode !== '' ? ' - ' + seasonAndEpisode : '') +
            (episodeTitle !== '' ? ' - ' + episodeTitle : '');
    };

    var inVodFrame = function(){
        var regexp = new RegExp('https:\/\/player\.pl(.*)');
        var match = regexp.exec(window.location.href);
        if(match[1]) {
            window.sessionStorage.setItem(config.storage.topWindowLocation, 'https://vod.pl' + match[1]);
        }
    };

    this.setup = function(){
        if(!Tool.isTopWindow()) {
            inVodFrame();
        }

        WrapperDetector.run(properties, this.setup);
    };
});
