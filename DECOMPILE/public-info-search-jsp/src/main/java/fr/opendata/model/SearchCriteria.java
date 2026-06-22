package fr.opendata.model;

public class SearchCriteria {
    private String q;
    private String name;
    private String sirenOrSiret;
    private String city;
    private String postalCode;
    private String address;
    private int page = 1;
    private int pageSize = 20;

    public String getQ() { return q; }
    public void setQ(String q) { this.q = clean(q); }
    public String getName() { return name; }
    public void setName(String name) { this.name = clean(name); }
    public String getSirenOrSiret() { return sirenOrSiret; }
    public void setSirenOrSiret(String sirenOrSiret) { this.sirenOrSiret = clean(sirenOrSiret); }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = clean(city); }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = clean(postalCode); }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = clean(address); }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = Math.max(1, page); }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = Math.min(100, Math.max(5, pageSize)); }
    public int offset() { return (page - 1) * pageSize; }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
