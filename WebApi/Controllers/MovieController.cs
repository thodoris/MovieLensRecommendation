using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using WebApi.Models;

namespace WebApi.Controllers
{
    [Route("api/entities.movie")]
    public class MovieController : Controller
    {

        public MovieController(IMovieLensRepository _movielensRepository)
        {
            repository = _movielensRepository;
        }
        public IMovieLensRepository repository { get; set; }


        [HttpGet]
        public IEnumerable<Movie> GetAll()
        {
            return repository.GetAllMovies();
        }

        [HttpGet("{mid}", Name = "GetMovieById")]
        public IActionResult GetById(int mid)
        {
            var item = repository.GetMovieById(mid);
            if (item == null)
            {
                return NotFound();
            }
            return new ObjectResult(item);
        }

        [Route("findMovies")]
        [HttpPost("keyword")]
        public IActionResult GetById(string keyword)
        {
            var items = repository.FindMovies(keyword);
            if (items == null)
            {
                return NotFound();
            }
            return new ObjectResult(items);
        }

      
    }
}
