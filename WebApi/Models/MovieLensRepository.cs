using System.Collections.Generic;
using System.Linq;

namespace WebApi.Models
{
    public class MovieLensRepository : IMovieLensRepository
    {
        private MovieLensContext _context;
        public MovieLensRepository(MovieLensContext context)
        {
            _context = context;
        }

        #region "Movies"

        public IEnumerable<Movie> GetAllMovies()
        {
            return _context.Movie.ToList();
            
        }
        public Movie GetMovieById(int mid)
        {
            return _context.Movie.FirstOrDefault(x => x.MovieId == mid);
        }

        /// <summary>
        /// Finds a movie 
        /// </summary>
        /// <param name="mid"></param>
        /// <returns></returns>
        public IEnumerable<Movie> FindMovies(string keyword)
        {   if (string.IsNullOrEmpty(keyword)) return GetAllMovies();
            else
                return _context.Movie.Where(x => x.Title.ToUpper().Contains(keyword.ToUpper())).ToList();
          
        }

        #endregion

        #region "Ratings"


        public IEnumerable<Rating> GetAllRatings()
        {
            return _context.Rating.ToList();

        }

        public IEnumerable<Rating> FindRatings(int[] mids)
        {
            return _context.Rating.Where(r => mids.Contains(r.MovieId)).ToList();
        }

        public IEnumerable<Rating>  GetRatingsByUserId(int uid)
        {
            return _context.Rating.Where(r => r.UserId == uid).ToList();
        }

      
    
        #endregion


    }
}
