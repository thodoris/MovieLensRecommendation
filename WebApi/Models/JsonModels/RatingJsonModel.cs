namespace WebApi.Models.JsonModels
{
    public class RatingJsonModel
    {
        public struct ratingsPKStruct
        {
            public int userId;
            public int movieId;
        };

        public ratingsPKStruct ratingsPK;
        public float rating;
   
    }
}
