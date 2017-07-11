using Newtonsoft.Json;

namespace WebApi.Models
{
    public partial class Link
    {
        public int MovieId { get; set; }
        public string ImdbId { get; set; }
        public string TmdbId { get; set; }

        [JsonIgnore]
        public virtual Movie Movie { get; set; }
    }
}
