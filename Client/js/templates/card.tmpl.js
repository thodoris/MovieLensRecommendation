'use strict';

let addedMovie2 =  ({ movie, fullRender , allowRating }) => MOVIEAPP.uihelpers.template`
 <div class="col" id="user_movie_${movie.movieId}">
  <div class="card2-container">
 <div class="card2" data-movieid="${movie.movieId}">
				<img src="${movie.poster}" alt="${movie.title}" />
				<div class="movieinfo">
         <a href="#" title="Remove" class="close close2 ratingvisible${allowRating}" data-movieid="${movie.movieId}"></a>
           <div class="rating ratingvisible${allowRating}">
                      ${[5,4,3,2,1].map(x=> `<input type="radio" name="user_movie_${movie.movieId}_rating" id="user_movie_${movie.movieId}_rating_r${x}" value="${x}" data-movieid="${movie.movieId}" onclick="event.stopPropagation();" ><label for="user_movie_${movie.movieId}_rating_r${x}"></label>`).join('\n      ')}
            </div>
					<h3>${movie.title}</h3>
           <p>${fullRender ? `${movie.plot}` : 'Plot not available'} </p>
           ${fullRender ? `<a href="http://www.imdb.com/title/tt${movie.imdbId}/" title="${movie.title}" target="_blank">More info</a>` : ''}
				</div>
			</div>
      </div>
       </div>`;

let addedMovie = ({ movie, fullRender , allowRating  }) => MOVIEAPP.uihelpers.template`
       <div class="col" id="user_movie_${movie.movieId}">
       <div class="card-container">
            <div class="card" data-movieid="${movie.movieId}">
            ${fullRender ? `<span class="card-header" style="background-image: url(${movie.poster})">` : `<span class="card-header" style="background-image: url(${MOVIEAPP.siteConfig.config.UI.defaultMoviePosterURL})">`} 
            <a href="#" title="Remove" class="close ratingvisible${allowRating}" data-movieid="${movie.movieId}"></a>
            <span class="card-title">
                      <div class="rating ratingvisible${allowRating}">
                      ${[5,4,3,2,1].map(x=> `<input type="radio" name="user_movie_${movie.movieId}_rating" id="user_movie_${movie.movieId}_rating_r${x}" value="${x}" data-movieid="${movie.movieId}" onclick="event.stopPropagation();" ><label for="user_movie_${movie.movieId}_rating_r${x}"></label>`).join('\n      ')}
                      </div>
                <h3>${movie.title}</h3><span> ${fullRender ? `(${movie.year})` : ''}</span>
            </span>
            </span>
            <span class="card-summary">
                   ${fullRender ? `<span> ${movie.plot}</span>` : 'Plot not available'} 
            </span>
            <span class="card-meta">
             ${fullRender ? `Genres:${movie.genres}` : ''}
            </span>
            </div>
            </div>
          </div>
          `;