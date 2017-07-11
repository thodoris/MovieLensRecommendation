using AutoMapper;
using System.Globalization;
using WebApi.Models.JsonModels;
using static WebApi.Models.JsonModels.RatingJsonModel;

namespace WebApi.Models.Mappings
{
    public class RatingProfile : Profile
    {
        public RatingProfile()
        {
            CreateMap<Rating, RatingJsonModel>()
            .ForMember(dest => dest.rating , opt=> opt.MapFrom(src => float.Parse(src.Rating1??"0".Replace(',', '.'), CultureInfo.InvariantCulture)))
            .ForMember(dest => dest.ratingsPK, opt => opt.ResolveUsing(src => new ratingsPKStruct() { movieId = src.MovieId  , userId = src.UserId  }));

        }
    }
}
