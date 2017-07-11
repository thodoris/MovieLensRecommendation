using Newtonsoft.Json;

namespace WebApi.Models
{
    public partial class Rating
    {
        public int UserId { get; set; }
        public int MovieId { get; set; }
        public string Rating1 { get; set; }
        public string Timestamp { get; set; }

        [JsonIgnore]
        public virtual Movie Movie { get; set; }
    }
}
