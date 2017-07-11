using System.Collections.Generic;

namespace WebApi.Models
{
    public interface IMovieLensRepository
    {
        //Movie
        IEnumerable<Movie> GetAllMovies();
        Movie GetMovieById(int id);
        IEnumerable<Movie> FindMovies(string keyword);

        //Ratings
        IEnumerable<Rating> GetAllRatings();
        IEnumerable<Rating> GetRatingsByUserId(int id);
        IEnumerable<Rating> FindRatings(int[] ids);

    }
}
