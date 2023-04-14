<script>
  import "../app.css";
  import { Layout } from "svelteway";
  export let data;
  let theme = JSON.parse(data.data.theme);
</script>

<Layout {data}>
  <div data-theme={theme}>
    <slot />
  </div>
</Layout>
