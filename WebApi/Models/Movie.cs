using Newtonsoft.Json;
using System.Collections.Generic;

namespace WebApi.Models
{
    public partial class Movie
    {
        public Movie()
        {
            Rating = new HashSet<Rating>();
        }

        public int MovieId { get; set; }
        public string Title { get; set; }
        public string Genres { get; set; }

        [JsonIgnore]
        public virtual Link Link { get; set; }
        [JsonIgnore]
        public virtual ICollection<Rating> Rating { get; set; }
    }
}
