using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using WebApi.Models;
using AutoMapper;
using WebApi.Models.JsonModels;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace WebApi.Controllers
{
    [Route("api/entities.ratings")]
    public class RatingsController : Controller
    {
        private readonly IMapper mapper;

        public RatingsController(IMovieLensRepository _movielensRepository, IMapper _mapper)
        {
            repository = _movielensRepository;
            mapper = _mapper;
        }
        public IMovieLensRepository repository { get; set; }


        [HttpGet]
        public IEnumerable<Rating> GetAll()
        {
            return repository.GetAllRatings();
        }

        [HttpGet("{uid}", Name = "GetRatingsByUserId")]
        public IActionResult GetByUserId(int uid)
        {
            var items = repository.GetRatingsByUserId(uid);
            if (items == null)
            {
                return NotFound();
            }
            var converted_items = mapper.Map<IEnumerable<Rating>, IEnumerable<RatingJsonModel>>(items);
            return new ObjectResult(converted_items);
        }

     
        [Route("findRatings")]
        [HttpPost]
        public IActionResult GetByMovieIds([FromBody] JObject RequestData)
        {
            string str_movieList = (string)RequestData["movieList"];
            JArray obj = JsonConvert.DeserializeObject<dynamic>(str_movieList);  
            int[] movieList = obj.ToObject<int[]>();

            var items = repository.FindRatings(movieList);
            if (items == null)
            {
                return NotFound();
            }
            var converted_items = mapper.Map<IEnumerable<Rating>, IEnumerable<RatingJsonModel>>(items);
            return new ObjectResult(converted_items);
         
        }
      
    }
}
